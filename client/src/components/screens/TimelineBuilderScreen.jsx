import { useEffect, useMemo, useRef, useState } from "react";
import { ACTIVITIES, formatDuration, minutesToLabel } from "../../game/activities.js";
import { listDays } from "../../api/days.js";
import { DAY_MINUTES, snapMinutes, clamp, neighborBounds } from "../../game/builderGeometry.js";
import { useTodayEntry } from "../../hooks/useTodayEntry.js";

const SNAP = 15; // minutes
const MIN_LEN = SNAP;
const TRACK_HEIGHT = 72;

function emptyPopupForm() {
  return { title: "", log: "", categoryKey: "", tags: [] };
}

function hourLabel(mins) {
  return minutesToLabel(mins).replace(":00", "");
}

export default function TimelineBuilderScreen({
  onBack,
  onBuild,
  initialBlocks = [],
  initialAnchorMinutes = null,
}) {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [dragState, setDragState] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [popupForm, setPopupForm] = useState(emptyPopupForm);
  const [tagInput, setTagInput] = useState("");
  const [pastTags, setPastTags] = useState([]);
  const [trackWidth, setTrackWidth] = useState(320);
  const [continuedFromToday, setContinuedFromToday] = useState(false);
  const trackRef = useRef(null);
  const dragStateRef = useRef(null);
  const todayEntry = useTodayEntry();
  const seededRef = useRef(false);

  // If today already has a saved "builder" day, pick up where it left off
  // instead of starting blank. Skipped when arriving via the chrono bar's
  // "jump to builder" shortcut (initialBlocks/initialAnchorMinutes set) —
  // that path already carries this run's own in-memory blocks, which are
  // more current than whatever's saved on the server.
  useEffect(() => {
    if (seededRef.current) return;
    if (initialBlocks.length > 0 || initialAnchorMinutes != null) return;
    if (!todayEntry || todayEntry.mode !== "builder") return;
    seededRef.current = true;
    setBlocks(
      (todayEntry.timelineBlocks || []).map((b) => ({
        id: crypto.randomUUID(),
        start: b.start,
        end: b.end,
        title: b.title || "",
        log: b.log || "",
        categoryKey: b.categoryKey ?? null,
        tags: b.tags || [],
      })),
    );
    setContinuedFromToday(true);
    // initialBlocks/initialAnchorMinutes are stable for the life of this screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayEntry]);

  useEffect(() => {
    listDays()
      .then((days) => {
        const tags = new Set();
        for (const day of days) {
          for (const item of [...(day.logCards || []), ...(day.timelineBlocks || [])]) {
            for (const tag of item.tags || []) tags.add(tag);
          }
        }
        setPastTags([...tags]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function measure() {
      if (trackRef.current) setTrackWidth(trackRef.current.clientWidth);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  const pxPerMin = trackWidth / DAY_MINUTES;

  function minutesFromClientX(clientX) {
    const rect = trackRef.current.getBoundingClientRect();
    return (clientX - rect.left) / pxPerMin;
  }

  function openPopup(block) {
    setEditingId(block.id);
    setPopupForm({
      title: block.title,
      log: block.log,
      categoryKey: block.categoryKey || "",
      tags: [...block.tags],
    });
    setTagInput("");
  }

  // Arriving here via the chrono bar's "jump to entry mode 2" shortcut:
  // pre-open a fresh block right at the tapped time, same as a real drag
  // would, instead of making the user drag it out themselves.
  useEffect(() => {
    if (initialAnchorMinutes == null) return;
    const bounds = neighborBounds(blocks, initialAnchorMinutes);
    if (bounds.hi - bounds.lo < MIN_LEN) return;
    const start = clamp(initialAnchorMinutes, bounds.lo, bounds.hi - MIN_LEN);
    const block = {
      id: crypto.randomUUID(),
      start,
      end: start + MIN_LEN,
      title: "",
      log: "",
      categoryKey: null,
      tags: [],
    };
    setBlocks((prev) => [...prev, block]);
    openPopup(block);
    // Only ever run once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function commitDrag(ds) {
    if (!ds) return;
    if (ds.type === "create") {
      let { start, end } = ds;
      if (end - start < MIN_LEN) {
        // A tap rather than a real drag: fall back to a minimum-length block
        // anchored at the tap point, but only if the gap actually fits one —
        // never shrink-to-fit into a too-small gap, that would overlap a
        // neighbor.
        if (ds.bounds.hi - ds.bounds.lo < MIN_LEN) return;
        start = clamp(ds.anchor, ds.bounds.lo, ds.bounds.hi - MIN_LEN);
        end = start + MIN_LEN;
      }
      const block = {
        id: crypto.randomUUID(),
        start,
        end,
        title: "",
        log: "",
        categoryKey: null,
        tags: [],
      };
      setBlocks((prev) => [...prev, block]);
      openPopup(block);
      return;
    }
    if (ds.type === "move") {
      if (!ds.moved) {
        const block = blocks.find((b) => b.id === ds.blockId);
        if (block) openPopup(block);
        return;
      }
      setBlocks((prev) =>
        prev.map((b) => (b.id === ds.blockId ? { ...b, start: ds.start, end: ds.end } : b)),
      );
      return;
    }
    if (ds.type === "resize-left" || ds.type === "resize-right") {
      setBlocks((prev) =>
        prev.map((b) => (b.id === ds.blockId ? { ...b, start: ds.start, end: ds.end } : b)),
      );
    }
  }

  useEffect(() => {
    if (!dragState) return;
    function onMove(e) {
      const ds = dragStateRef.current;
      if (!ds) return;
      const mins = clamp(snapMinutes(minutesFromClientX(e.clientX), SNAP), 0, DAY_MINUTES);
      setDragState((prev) => {
        if (!prev) return prev;
        if (prev.type === "create") {
          const start = Math.min(prev.anchor, mins);
          const end = Math.max(prev.anchor, mins);
          return {
            ...prev,
            start: clamp(start, prev.bounds.lo, prev.bounds.hi),
            end: clamp(end, prev.bounds.lo, prev.bounds.hi),
          };
        }
        if (prev.type === "move") {
          const start = clamp(mins - prev.grabOffset, prev.bounds.lo, prev.bounds.hi - prev.len);
          const moved = prev.moved || Math.abs(start - prev.origStart) >= SNAP;
          return { ...prev, start, end: start + prev.len, moved };
        }
        if (prev.type === "resize-left") {
          const start = clamp(
            Math.min(mins, prev.end - MIN_LEN),
            prev.bounds.lo,
            prev.end - MIN_LEN,
          );
          return { ...prev, start };
        }
        if (prev.type === "resize-right") {
          const end = clamp(
            Math.max(mins, prev.start + MIN_LEN),
            prev.start + MIN_LEN,
            prev.bounds.hi,
          );
          return { ...prev, end };
        }
        return prev;
      });
    }
    function onUp() {
      commitDrag(dragStateRef.current);
      setDragState(null);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    // Re-subscribe only when a drag starts/ends, not on every intermediate update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragState === null]);

  function onTrackPointerDown(e) {
    if (dragState || editingId) return;
    const anchor = clamp(snapMinutes(minutesFromClientX(e.clientX), SNAP), 0, DAY_MINUTES);
    const bounds = neighborBounds(blocks, anchor);
    setDragState({ type: "create", anchor, bounds, start: anchor, end: anchor });
  }

  function onBlockPointerDown(e, block) {
    e.stopPropagation();
    if (dragState || editingId) return;
    const grabMin = minutesFromClientX(e.clientX);
    const bounds = neighborBounds(blocks, block.start, block.id);
    setDragState({
      type: "move",
      blockId: block.id,
      bounds,
      len: block.end - block.start,
      grabOffset: grabMin - block.start,
      origStart: block.start,
      start: block.start,
      end: block.end,
      moved: false,
    });
  }

  function onEdgePointerDown(e, block, side) {
    e.stopPropagation();
    if (dragState || editingId) return;
    const bounds = neighborBounds(blocks, block.start, block.id);
    setDragState({
      type: side === "left" ? "resize-left" : "resize-right",
      blockId: block.id,
      bounds,
      start: block.start,
      end: block.end,
    });
  }

  function closePopup() {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === editingId
          ? {
              ...b,
              title: popupForm.title.trim(),
              log: popupForm.log.trim(),
              categoryKey: popupForm.categoryKey || null,
              tags: popupForm.tags,
            }
          : b,
      ),
    );
    setEditingId(null);
  }

  function removeBlock(id) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function addTag(raw) {
    const tag = raw.trim();
    if (!tag || popupForm.tags.includes(tag)) return;
    setPopupForm((f) => ({ ...f, tags: [...f.tags, tag] }));
    setTagInput("");
  }

  function removeTag(tag) {
    setPopupForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  }

  function handleTagKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === "Backspace" && tagInput === "" && popupForm.tags.length) {
      removeTag(popupForm.tags[popupForm.tags.length - 1]);
    }
  }

  const displayBlocks = useMemo(() => {
    if (dragState && (dragState.type === "move" || dragState.type.startsWith("resize"))) {
      return blocks.map((b) =>
        b.id === dragState.blockId ? { ...b, start: dragState.start, end: dragState.end } : b,
      );
    }
    return blocks;
  }, [blocks, dragState]);

  const totalLoggedMins = useMemo(
    () => blocks.reduce((sum, b) => sum + (b.categoryKey ? b.end - b.start : 0), 0),
    [blocks],
  );

  const suggestionPool = useMemo(() => {
    const fromBlocks = blocks.flatMap((b) => b.tags);
    return [...new Set([...fromBlocks, ...pastTags])];
  }, [blocks, pastTags]);

  const suggestions = useMemo(() => {
    const q = tagInput.trim().toLowerCase();
    if (!q) return [];
    return suggestionPool
      .filter((t) => t.toLowerCase().includes(q) && !popupForm.tags.includes(t))
      .slice(0, 6);
  }, [tagInput, suggestionPool, popupForm.tags]);

  const editingBlock = blocks.find((b) => b.id === editingId) || null;

  return (
    <div className="screen active">
      <div className="panel" style={{ paddingBottom: 10 }}>
        <div className="backRow">
          <button className="backLink" onClick={onBack}>
            ← Back
          </button>
        </div>
        <h1 style={{ marginBottom: 2 }}>Drag Your Day Together</h1>
        <p className="sub" style={{ marginBottom: 6 }}>
          Drag across the ruler to block out time you spent on something. Tap a block to edit it, or
          drag its edges to resize. Anything you don&apos;t touch stays black box.
        </p>
        {continuedFromToday && (
          <p className="sub" style={{ marginBottom: 6 }}>
            Picking up where you left off today.
          </p>
        )}

        <div className="builderTotals">
          {totalLoggedMins > 0
            ? `${formatDuration(totalLoggedMins)} logged of 24h`
            : "Nothing logged yet — drag to start"}
        </div>

        <div
          id="builderTrack"
          className="builderTrack"
          ref={trackRef}
          style={{ height: TRACK_HEIGHT, touchAction: "none" }}
          onPointerDown={onTrackPointerDown}
        >
          {Array.from({ length: 13 }, (_, i) => i * 120).map((mins) => (
            <div key={mins} className="builderHourTick" style={{ left: mins * pxPerMin }}>
              <span className="builderHourLabel">{hourLabel(mins)}</span>
            </div>
          ))}

          {displayBlocks.map((block) => {
            const act = block.categoryKey && ACTIVITIES.find((a) => a.key === block.categoryKey);
            const color = act ? act.color : "#2A2438";
            const widthPx = Math.max(2, (block.end - block.start) * pxPerMin);
            return (
              <div
                key={block.id}
                className={"builderBlock" + (act ? "" : " untitled")}
                style={{
                  left: block.start * pxPerMin,
                  width: widthPx,
                  background: color,
                }}
                onPointerDown={(e) => onBlockPointerDown(e, block)}
              >
                {widthPx > 34 && (
                  <span className="builderBlockLabel">
                    {act ? `${act.emoji} ${block.title || act.label}` : "❔"}
                  </span>
                )}
                <div
                  className="builderEdgeHandle left"
                  onPointerDown={(e) => onEdgePointerDown(e, block, "left")}
                />
                <div
                  className="builderEdgeHandle right"
                  onPointerDown={(e) => onEdgePointerDown(e, block, "right")}
                />
              </div>
            );
          })}

          {dragState?.type === "create" && (
            <div
              className="builderBlock ghost"
              style={{
                left: dragState.start * pxPerMin,
                width: Math.max(2, (dragState.end - dragState.start) * pxPerMin),
              }}
            />
          )}
        </div>

        {dragState?.type === "create" && (
          <div className="builderStatusLine">
            {minutesToLabel(dragState.start)} – {minutesToLabel(dragState.end)} (
            {formatDuration(dragState.end - dragState.start)})
          </div>
        )}

        <div style={{ height: 10 }} />
        <button
          className="primaryBtn"
          disabled={blocks.length === 0}
          style={{ background: "#3F5B6B" }}
          onClick={() => onBuild(blocks)}
        >
          Build My Level
        </button>
      </div>

      {editingBlock && (
        <div className="builderPopupBackdrop" onClick={closePopup}>
          <div className="builderPopupSheet" onClick={(e) => e.stopPropagation()}>
            <div className="builderPopupHead">
              <span>
                {minutesToLabel(editingBlock.start)} – {minutesToLabel(editingBlock.end)}
              </span>
              <span className="logCardDuration">
                {formatDuration(editingBlock.end - editingBlock.start)}
              </span>
            </div>

            <input
              type="text"
              placeholder="What did you do? (optional)"
              value={popupForm.title}
              onChange={(e) => setPopupForm((f) => ({ ...f, title: e.target.value }))}
              style={{ marginTop: 8 }}
            />

            <select
              value={popupForm.categoryKey}
              onChange={(e) => setPopupForm((f) => ({ ...f, categoryKey: e.target.value }))}
              style={{ marginTop: 8 }}
            >
              <option value="">❔ Leave as black box</option>
              {ACTIVITIES.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.emoji} {a.label}
                </option>
              ))}
            </select>

            <textarea
              placeholder="Add a note (optional)"
              value={popupForm.log}
              onChange={(e) => setPopupForm((f) => ({ ...f, log: e.target.value }))}
              style={{ marginTop: 8, minHeight: 50 }}
            />

            <div className="tagRow" style={{ marginTop: 8 }}>
              {popupForm.tags.map((t) => (
                <span className="tagChip removable" key={t} onClick={() => removeTag(t)}>
                  #{t} ✕
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="+ add a tag, press Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              style={{ marginTop: 6 }}
            />
            {suggestions.length > 0 && (
              <div className="tagRow" style={{ marginTop: 6 }}>
                {suggestions.map((t) => (
                  <span className="tagChip suggestion" key={t} onClick={() => addTag(t)}>
                    #{t}
                  </span>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button className="primaryBtn" style={{ flex: 1 }} onClick={closePopup}>
                Done
              </button>
              <button className="ghostBtn" onClick={() => removeBlock(editingBlock.id)}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
