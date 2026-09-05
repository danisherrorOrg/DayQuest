import { useEffect, useMemo, useRef, useState } from "react";
import { ACTIVITIES, formatDuration } from "../../game/activities.js";
import { listDays } from "../../api/days.js";
import { useTodayEntry } from "../../hooks/useTodayEntry.js";

const DAY_MINUTES = 1440;

function emptyForm() {
  return {
    id: null,
    hours: "",
    minutes: "",
    title: "",
    log: "",
    categoryKey: ACTIVITIES[0].key,
    tags: [],
  };
}

export default function LogCardModeScreen({ onBack, onBuild }) {
  const [cards, setCards] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [tagInput, setTagInput] = useState("");
  const [pastTags, setPastTags] = useState([]);
  const [continuedFromToday, setContinuedFromToday] = useState(false);
  const todayEntry = useTodayEntry();
  const seededRef = useRef(false);

  // If today already has a saved "cards" day, pick up where it left off
  // instead of starting blank — a second logging session the same day adds
  // to the first rather than losing it on save. A day saved in a different
  // mode has no `logCards` to seed from, so this is a no-op for it.
  useEffect(() => {
    if (seededRef.current || !todayEntry || todayEntry.mode !== "cards") return;
    seededRef.current = true;
    setCards(
      (todayEntry.logCards || []).map((c) => ({
        id: crypto.randomUUID(),
        title: c.title,
        log: c.log || "",
        categoryKey: c.categoryKey,
        tags: c.tags || [],
        durationMins: c.durationMins,
      })),
    );
    setContinuedFromToday(true);
  }, [todayEntry]);

  // Best-effort: seed tag autocomplete from previously saved log-card days too.
  // Fine to silently no-op if this fails (offline, no saved days yet, etc).
  useEffect(() => {
    listDays()
      .then((days) => {
        const tags = new Set();
        for (const day of days) {
          for (const card of day.logCards || []) {
            for (const tag of card.tags || []) tags.add(tag);
          }
        }
        setPastTags([...tags]);
      })
      .catch(() => {});
  }, []);

  const durationMins = (Number(form.hours) || 0) * 60 + (Number(form.minutes) || 0);
  const isEditing = form.id !== null;

  const totalLoggedMins = useMemo(() => cards.reduce((sum, c) => sum + c.durationMins, 0), [cards]);
  const remainingMins = DAY_MINUTES - totalLoggedMins;

  const suggestionPool = useMemo(() => {
    const fromCards = cards.flatMap((c) => c.tags);
    return [...new Set([...fromCards, ...pastTags])];
  }, [cards, pastTags]);

  const suggestions = useMemo(() => {
    const q = tagInput.trim().toLowerCase();
    if (!q) return [];
    return suggestionPool
      .filter((t) => t.toLowerCase().includes(q) && !form.tags.includes(t))
      .slice(0, 6);
  }, [tagInput, suggestionPool, form.tags]);

  function addTag(raw) {
    const tag = raw.trim();
    if (!tag || form.tags.includes(tag)) return;
    setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
    setTagInput("");
  }

  function removeTag(tag) {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  }

  function handleTagKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === "Backspace" && tagInput === "" && form.tags.length) {
      removeTag(form.tags[form.tags.length - 1]);
    }
  }

  function resetForm() {
    setForm(emptyForm());
    setTagInput("");
  }

  function saveCard() {
    const title = form.title.trim();
    if (!title || durationMins <= 0) return;
    const entry = {
      id: form.id ?? crypto.randomUUID(),
      title,
      log: form.log.trim(),
      categoryKey: form.categoryKey,
      tags: form.tags,
      durationMins,
    };
    setCards((prev) =>
      isEditing ? prev.map((c) => (c.id === entry.id ? entry : c)) : [...prev, entry],
    );
    resetForm();
  }

  function editCard(card) {
    setForm({
      id: card.id,
      hours: String(Math.floor(card.durationMins / 60) || ""),
      minutes: String(card.durationMins % 60 || ""),
      title: card.title,
      log: card.log,
      categoryKey: card.categoryKey,
      tags: card.tags,
    });
    setTagInput("");
  }

  function removeCard(id) {
    setCards((prev) => prev.filter((c) => c.id !== id));
    if (form.id === id) resetForm();
  }

  const category = ACTIVITIES.find((a) => a.key === form.categoryKey) || ACTIVITIES[0];

  return (
    <div className="screen active">
      <div className="panel" style={{ paddingBottom: 10 }}>
        <div className="backRow">
          <button className="backLink" onClick={onBack}>
            ← Back
          </button>
        </div>
        <h1 style={{ marginBottom: 2 }}>Log It, Card by Card</h1>
        <p className="sub" style={{ marginBottom: 6 }}>
          One card per activity — how long, what it was, and anything else worth remembering.
        </p>
        {continuedFromToday && (
          <p className="sub" style={{ marginBottom: 6 }}>
            Picking up where you left off today.
          </p>
        )}

        <div id="logCardList" style={{ flex: 1, overflowY: "auto", marginBottom: 10 }}>
          {cards.length === 0 && (
            <div id="emptyMoments">No cards yet — add your first one below.</div>
          )}
          {cards.map((card) => {
            const act = ACTIVITIES.find((a) => a.key === card.categoryKey) || ACTIVITIES[0];
            return (
              <div className="logCard" key={card.id} style={{ borderLeftColor: act.color }}>
                <div className="logCardHead">
                  <span className="logCardTitle">
                    {act.emoji} {card.title}
                  </span>
                  <span className="logCardDuration">{formatDuration(card.durationMins)}</span>
                </div>
                {card.log && <div className="logCardLog">{card.log}</div>}
                {card.tags.length > 0 && (
                  <div className="tagRow">
                    {card.tags.map((t) => (
                      <span className="tagChip" key={t}>
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
                <div className="momentActions">
                  <button onClick={() => editCard(card)}>✎ edit</button>
                  <button onClick={() => removeCard(card.id)}>✕ remove</button>
                </div>
              </div>
            );
          })}
        </div>

        <div id="logCardTotals" className="logCardTotals">
          Logged {formatDuration(totalLoggedMins)} of 24h —{" "}
          {remainingMins > 0
            ? `${formatDuration(remainingMins)} still a black box`
            : remainingMins === 0
              ? "the day is fully logged"
              : `${formatDuration(-remainingMins)} over 24h`}
        </div>

        <div id="logCardForm" style={{ borderTop: "1.5px solid #e8d2b0", paddingTop: 10 }}>
          <div className="durationRow">
            <label className="fieldLabel">
              Duration
              <div className="durationInputs">
                <input
                  type="number"
                  min="0"
                  max="24"
                  placeholder="0"
                  value={form.hours}
                  onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))}
                />
                <span>h</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="0"
                  value={form.minutes}
                  onChange={(e) => setForm((f) => ({ ...f, minutes: e.target.value }))}
                />
                <span>m</span>
              </div>
            </label>
            <label className="fieldLabel" style={{ flex: 1 }}>
              Category
              <select
                value={form.categoryKey}
                onChange={(e) => setForm((f) => ({ ...f, categoryKey: e.target.value }))}
                style={{ borderLeft: `4px solid ${category.color}` }}
              >
                {ACTIVITIES.map((a) => (
                  <option key={a.key} value={a.key}>
                    {a.emoji} {a.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <input
            type="text"
            placeholder="What did you do?"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            style={{ marginTop: 8 }}
          />

          <textarea
            placeholder="Add a note, or leave blank (optional)"
            value={form.log}
            onChange={(e) => setForm((f) => ({ ...f, log: e.target.value }))}
            style={{ marginTop: 8, minHeight: 60 }}
          />

          <div className="tagRow" style={{ marginTop: 8 }}>
            {form.tags.map((t) => (
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
            <button
              className="primaryBtn"
              style={{ flex: 1 }}
              disabled={form.title.trim().length === 0 || durationMins <= 0}
              onClick={saveCard}
            >
              {isEditing ? "Save Changes" : "Add Card"}
            </button>
            {isEditing && (
              <button className="ghostBtn" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </div>

        <div style={{ height: 10 }} />
        <button
          className="primaryBtn"
          disabled={cards.length === 0}
          style={{ background: "#3F5B6B" }}
          onClick={() => onBuild(cards)}
        >
          Build My Level
        </button>
      </div>
    </div>
  );
}
