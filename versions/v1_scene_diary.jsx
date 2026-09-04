import React, { useState, useEffect, useRef } from "react";

// ---- Activity dictionary: keyword -> {label, color, draw fn key} ----
const ACTIVITIES = [
  { key: "work", label: "Work", color: "#3F5B6B", words: ["work", "office", "meeting", "email", "project", "boss", "client", "deadline"] },
  { key: "code", label: "Coded", color: "#5B7B9A", words: ["code", "coding", "programming", "bug", "debug", "developed"] },
  { key: "gym", label: "Gym", color: "#C1502E", words: ["gym", "workout", "exercise", "lift", "weights", "run", "running", "jog"] },
  { key: "food", label: "Food", color: "#E8A03D", words: ["ate", "food", "lunch", "dinner", "breakfast", "cooked", "cooking", "restaurant", "meal"] },
  { key: "family", label: "Family", color: "#B5566B", words: ["family", "kids", "children", "mom", "dad", "parents", "son", "daughter", "wife", "husband"] },
  { key: "friends", label: "Friends", color: "#5A8F6F", words: ["friend", "friends", "hangout", "party", "chat"] },
  { key: "study", label: "Study", color: "#7A5FA0", words: ["study", "studied", "read", "reading", "book", "learned", "class", "course"] },
  { key: "sleep", label: "Rest", color: "#2E3A59", words: ["sleep", "slept", "nap", "tired", "rest", "bed"] },
  { key: "music", label: "Music", color: "#D4715B", words: ["music", "song", "guitar", "sang", "concert", "listened"] },
  { key: "travel", label: "Travel", color: "#4E8A8A", words: ["travel", "drive", "drove", "trip", "flight", "airport", "car"] },
  { key: "movie", label: "Movie", color: "#8C5B9A", words: ["movie", "film", "watched", "netflix", "show"] },
  { key: "walk", label: "Walk", color: "#6B9B6E", words: ["walk", "walked", "stroll", "park"] },
  { key: "shopping", label: "Shopping", color: "#C97BAE", words: ["shopping", "shop", "bought", "store", "market"] },
  { key: "clean", label: "Clean", color: "#7FA6A0", words: ["clean", "cleaned", "laundry", "dishes", "chores"] },
  { key: "coffee", label: "Coffee", color: "#8B5E3C", words: ["coffee", "tea", "cafe"] },
];

function detectActivities(text) {
  const lower = text.toLowerCase();
  const found = [];
  for (const act of ACTIVITIES) {
    if (act.words.some((w) => lower.includes(w))) found.push(act);
  }
  return found;
}

function buildSummary(text, acts) {
  if (acts.length === 0) {
    return "A quiet day — nothing jumped out, but every day still counts.";
  }
  const labels = acts.map((a) => a.label.toLowerCase());
  let phrase;
  if (labels.length === 1) phrase = labels[0];
  else if (labels.length === 2) phrase = `${labels[0]} and ${labels[1]}`;
  else phrase = `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
  return `Today was shaped by ${phrase}.`;
}

// ---- Small icon glyphs (simple, readable at tiny size) ----
function Glyph({ k, color }) {
  const s = { fill: "none", stroke: "#FFF8EC", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (k) {
    case "work":
      return <g><rect x="-9" y="-6" width="18" height="12" rx="1.5" style={s} /><path d="M-4 -6 v-3 h8 v3" style={s} /></g>;
    case "code":
      return <g><path d="M-6 -5 l-5 6 l5 6" style={s} /><path d="M6 -5 l5 6 l-5 6" style={s} /></g>;
    case "gym":
      return <g><rect x="-11" y="-3" width="6" height="6" rx="1" style={s} /><rect x="5" y="-3" width="6" height="6" rx="1" style={s} /><path d="M-5 0 h10" style={s} /></g>;
    case "food":
      return <g><circle cx="0" cy="0" r="9" style={s} /><circle cx="0" cy="0" r="3.5" style={{ ...s, stroke: "#FFF8EC" }} /></g>;
    case "family":
      return <g><circle cx="-5" cy="-5" r="3.2" style={s} /><circle cx="5" cy="-5" r="3.2" style={s} /><path d="M-9 8 q4 -8 9 0 q5 -8 9 0" style={s} /></g>;
    case "friends":
      return <g><circle cx="-4" cy="-4" r="4" style={s} /><circle cx="5" cy="-2" r="3.2" style={s} /><path d="M-9 8 q5 -7 10 0" style={s} /></g>;
    case "study":
      return <g><path d="M-9 -6 h8 v13 h-8 z" style={s} /><path d="M1 -6 h8 v13 h-8 z" style={s} /></g>;
    case "sleep":
      return <g><path d="M6 -8 a8 8 0 1 0 0 16 a10 10 0 0 1 0 -16 z" style={s} /></g>;
    case "music":
      return <g><circle cx="-5" cy="6" r="3" style={s} /><path d="M-2 6 v-13 l9 -2 v13" style={s} /><circle cx="4" cy="4" r="3" style={s} /></g>;
    case "travel":
      return <g><path d="M-10 3 h20 l-3 -7 h-14 z" style={s} /><circle cx="-5" cy="6" r="2" style={s} /><circle cx="5" cy="6" r="2" style={s} /></g>;
    case "movie":
      return <g><rect x="-9" y="-6" width="18" height="12" rx="1.5" style={s} /><path d="M-9 -2 l4 -4 M-2 -2 l4 -4 M5 -2 l4 -4" style={s} /></g>;
    case "walk":
      return <g><circle cx="0" cy="-8" r="2.6" style={s} /><path d="M0 -5 v6 M0 1 l-5 6 M0 1 l5 5 M-4 -1 l-3 3 M4 -1 l3 2" style={s} /></g>;
    case "shopping":
      return <g><path d="M-7 -3 h14 l-2 11 h-10 z" style={s} /><path d="M-3 -3 v-2 a3 3 0 0 1 6 0 v2" style={s} /></g>;
    case "clean":
      return <g><path d="M0 -9 v12" style={s} /><path d="M-6 3 h12 l-2 6 h-8 z" style={s} /></g>;
    case "coffee":
      return <g><path d="M-7 -4 h12 v7 a6 6 0 0 1 -12 0 z" style={s} /><path d="M5 -2 q5 0 5 4 q0 4 -5 4" style={s} /></g>;
    default:
      return <circle r="6" style={s} />;
  }
}

// deterministic pseudo-random layout so icons don't overlap awkwardly
function layoutPositions(n) {
  const spots = [
    [70, 150], [140, 120], [210, 160], [270, 110], [330, 155],
    [100, 195], [190, 205], [255, 195], [330, 200], [45, 110],
    [300, 90], [165, 90], [230, 60], [95, 60], [360, 130],
  ];
  return spots.slice(0, n);
}

function DayScene({ activities, dateLabel }) {
  const pos = layoutPositions(activities.length);
  return (
    <svg viewBox="0 0 400 240" style={{ width: "100%", height: "auto", borderRadius: 16, display: "block" }}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FCE3B0" />
          <stop offset="55%" stopColor="#F3AE6D" />
          <stop offset="100%" stopColor="#E8825C" />
        </linearGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7FAE72" />
          <stop offset="100%" stopColor="#5C8F5A" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="400" height="240" fill="url(#sky)" />
      <circle cx="335" cy="42" r="26" fill="#FFE9B8" opacity="0.9" />
      <path d="M0 175 Q 100 150 200 172 T 400 168 V240 H0 Z" fill="url(#ground)" />
      <text x="16" y="24" fontFamily="Fraunces, Georgia, serif" fontSize="15" fill="#3F2B1D" opacity="0.75">
        {dateLabel}
      </text>
      {activities.length === 0 && (
        <text x="200" y="130" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="13" fill="#3F2B1D" opacity="0.6">
          write your day below to fill this scene
        </text>
      )}
      {activities.map((act, i) => {
        const [x, y] = pos[i] || [200, 150];
        return (
          <g key={act.key} transform={`translate(${x}, ${y})`}>
            <circle r="16" fill={act.color} stroke="#FFF8EC" strokeWidth="1.5" />
            <Glyph k={act.key} color={act.color} />
            <text y="27" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="9.5" fill="#3F2B1D" fontWeight="600">
              {act.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function prettyDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export default function DayStory() {
  const [text, setText] = useState("");
  const [activeDate, setActiveDate] = useState(todayISO());
  const [entries, setEntries] = useState({}); // { iso: { text, activities: [keys], summary } }
  const [savedKeys, setSavedKeys] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | saving | error
  const loadedOnce = useRef(false);

  useEffect(() => {
    (async () => {
      setStatus("loading");
      try {
        const list = await window.storage.list("diary:", false);
        const keys = list?.keys || [];
        const loaded = {};
        for (const k of keys) {
          try {
            const res = await window.storage.get(k, false);
            if (res?.value) {
              const iso = k.replace("diary:", "");
              loaded[iso] = JSON.parse(res.value);
            }
          } catch (e) {
            // skip unreadable entry
          }
        }
        setEntries(loaded);
        setSavedKeys(Object.keys(loaded).sort().reverse());
        if (loaded[todayISO()]) setText(loaded[todayISO()].text);
      } catch (e) {
        // no entries yet, or storage unavailable — start fresh
      } finally {
        setStatus("idle");
        loadedOnce.current = true;
      }
    })();
  }, []);

  const currentEntry = entries[activeDate];
  const liveActs = detectActivities(text);
  const displayedActs = activeDate === todayISO() && !currentEntry
    ? liveActs
    : currentEntry
    ? currentEntry.activities.map((k) => ACTIVITIES.find((a) => a.key === k)).filter(Boolean)
    : liveActs;

  async function saveDay() {
    if (!text.trim()) return;
    setStatus("saving");
    const acts = detectActivities(text);
    const summary = buildSummary(text, acts);
    const entry = { text, activities: acts.map((a) => a.key), summary, savedAt: new Date().toISOString() };
    try {
      await window.storage.set(`diary:${activeDate}`, JSON.stringify(entry), false);
      setEntries((prev) => ({ ...prev, [activeDate]: entry }));
      setSavedKeys((prev) => (prev.includes(activeDate) ? prev : [activeDate, ...prev].sort().reverse()));
    } catch (e) {
      // ignore; UI still reflects local state
    } finally {
      setStatus("idle");
    }
  }

  function openDay(iso) {
    setActiveDate(iso);
    setText(entries[iso]?.text || "");
  }

  function newToday() {
    const t = todayISO();
    setActiveDate(t);
    setText(entries[t]?.text || "");
  }

  const isToday = activeDate === todayISO();

  return (
    <div style={{
      fontFamily: "Inter, -apple-system, sans-serif",
      background: "#FFF8EC",
      minHeight: "100%",
      padding: "18px 16px 28px",
      boxSizing: "border-box",
      color: "#3F2B1D",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
        .ds-btn { border: none; border-radius: 10px; padding: 10px 16px; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 14px; cursor: pointer; transition: transform 0.1s ease; }
        .ds-btn:active { transform: scale(0.97); }
        .ds-chip { border: none; border-radius: 999px; padding: 6px 12px; font-family: 'Inter', sans-serif; font-size: 12.5px; font-weight: 600; cursor: pointer; white-space: nowrap; }
        textarea::placeholder { color: #B08B6E; }
      `}</style>

      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        <h1 style={{
          fontFamily: "Fraunces, Georgia, serif",
          fontWeight: 700,
          fontSize: "26px",
          margin: "4px 0 2px",
        }}>
          Day Story
        </h1>
        <p style={{ margin: "0 0 16px", fontSize: 14, color: "#7A5A42" }}>
          Write your day. Watch it become a little world you can revisit.
        </p>

        <DayScene activities={displayedActs} dateLabel={prettyDate(activeDate)} />

        <div style={{ marginTop: 14 }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!isToday && !!currentEntry}
            placeholder="e.g. Went to the gym in the morning, had a work meeting, cooked dinner with my kids..."
            rows={4}
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: "1.5px solid #E8D2B0",
              borderRadius: 12,
              padding: "12px 14px",
              fontSize: 14.5,
              fontFamily: "Inter, sans-serif",
              resize: "vertical",
              background: "#FFFEFB",
              color: "#3F2B1D",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
          <button
            className="ds-btn"
            onClick={saveDay}
            disabled={!text.trim() || status === "saving"}
            style={{
              background: text.trim() ? "#C1502E" : "#E8D2B0",
              color: "#FFF8EC",
              opacity: status === "saving" ? 0.7 : 1,
            }}
          >
            {status === "saving" ? "Saving..." : currentEntry ? "Update this day" : "Save today"}
          </button>
          {!isToday && (
            <button className="ds-btn" onClick={newToday} style={{ background: "#FFF8EC", color: "#3F2B1D", border: "1.5px solid #E8D2B0" }}>
              Back to today
            </button>
          )}
        </div>

        {(currentEntry || liveActs.length > 0) && (
          <div style={{
            marginTop: 16,
            background: "#FFFEFB",
            border: "1.5px solid #E8D2B0",
            borderRadius: 12,
            padding: "12px 14px",
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#B0703F", marginBottom: 4 }}>Summary</div>
            <div style={{ fontSize: 14.5, lineHeight: 1.5 }}>
              {currentEntry ? currentEntry.summary : buildSummary(text, liveActs)}
            </div>
          </div>
        )}

        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#B0703F", marginBottom: 8 }}>
            {savedKeys.length > 0 ? "Past days" : status === "loading" ? "Loading past days..." : "No saved days yet"}
          </div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {savedKeys.map((iso) => (
              <button
                key={iso}
                className="ds-chip"
                onClick={() => openDay(iso)}
                style={{
                  background: iso === activeDate ? "#3F5B6B" : "#F3E4C8",
                  color: iso === activeDate ? "#FFF8EC" : "#3F2B1D",
                }}
              >
                {new Date(iso + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
