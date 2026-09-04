export const ACTIVITIES = [
  {
    key: "work",
    label: "Work",
    color: "#3F5B6B",
    emoji: "💼",
    words: ["work", "office", "meeting", "email", "project", "boss", "client", "deadline"],
  },
  {
    key: "code",
    label: "Coded",
    color: "#5B7B9A",
    emoji: "💻",
    words: ["code", "coding", "programming", "bug", "debug", "developed"],
  },
  {
    key: "gym",
    label: "Gym",
    color: "#C1502E",
    emoji: "🏋️",
    words: ["gym", "workout", "exercise", "lift", "weights", "run", "running", "jog"],
  },
  {
    key: "food",
    label: "Food",
    color: "#E8A03D",
    emoji: "🍽️",
    words: [
      "ate",
      "food",
      "lunch",
      "dinner",
      "breakfast",
      "cooked",
      "cooking",
      "restaurant",
      "meal",
    ],
  },
  {
    key: "family",
    label: "Family",
    color: "#B5566B",
    emoji: "👨‍👩‍👧",
    words: [
      "family",
      "kids",
      "children",
      "mom",
      "dad",
      "parents",
      "son",
      "daughter",
      "wife",
      "husband",
    ],
  },
  {
    key: "friends",
    label: "Friends",
    color: "#5A8F6F",
    emoji: "🧑‍🤝‍🧑",
    words: ["friend", "friends", "hangout", "party", "chat"],
  },
  {
    key: "study",
    label: "Study",
    color: "#7A5FA0",
    emoji: "📚",
    words: ["study", "studied", "read", "reading", "book", "learned", "class", "course"],
  },
  {
    key: "sleep",
    label: "Sleep",
    color: "#2E3A59",
    emoji: "🌙",
    words: ["sleep", "slept", "nap", "tired", "rest", "bed"],
  },
  {
    key: "music",
    label: "Music",
    color: "#D4715B",
    emoji: "🎵",
    words: ["music", "song", "guitar", "sang", "concert", "listened"],
  },
  {
    key: "travel",
    label: "Travel",
    color: "#4E8A8A",
    emoji: "🚗",
    words: ["travel", "drive", "drove", "trip", "flight", "airport", "car", "commute"],
  },
  {
    key: "movie",
    label: "Movie",
    color: "#8C5B9A",
    emoji: "🎬",
    words: ["movie", "film", "watched", "netflix", "show"],
  },
  {
    key: "walk",
    label: "Walk",
    color: "#6B9B6E",
    emoji: "🚶",
    words: ["walk", "walked", "stroll", "park"],
  },
  {
    key: "shopping",
    label: "Shopping",
    color: "#C97BAE",
    emoji: "🛍️",
    words: ["shopping", "shop", "bought", "store", "market"],
  },
  {
    key: "clean",
    label: "Clean",
    color: "#7FA6A0",
    emoji: "🧹",
    words: ["clean", "cleaned", "laundry", "dishes", "chores"],
  },
  {
    key: "coffee",
    label: "Coffee",
    color: "#8B5E3C",
    emoji: "☕",
    words: ["coffee", "tea", "cafe"],
  },
];

export const BLACKBOX = { key: null, label: "Unknown", color: "#2A2438", emoji: "❔", words: [] };

export function findActivityByKey(key) {
  return ACTIVITIES.find((a) => a.key === key) || null;
}

export function guessActivityFromText(text) {
  const lower = text.toLowerCase();
  for (const act of ACTIVITIES) {
    if (act.words.some((w) => lower.includes(w))) return act;
  }
  const label = text.trim().split(/\s+/).slice(0, 3).join(" ");
  const palette = ["#8C6E4F", "#5E7A9A", "#9A6B7A", "#6E8C6E", "#7A6E9A"];
  const hash = [...text].reduce((a, c) => a + c.charCodeAt(0), 0);
  return {
    key: "custom_" + hash,
    label: label.charAt(0).toUpperCase() + label.slice(1),
    color: palette[hash % palette.length],
    emoji: "⭐",
    words: [],
  };
}

export function minutesToLabel(mins) {
  mins = ((mins % 1440) + 1440) % 1440;
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return h12 + ":" + String(m).padStart(2, "0") + " " + ampm;
}
