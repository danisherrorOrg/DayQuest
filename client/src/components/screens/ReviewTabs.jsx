// Small floating switcher between the two review modes, dropped into the
// top of whichever recap screen is active (dialogue recap or chrono bar).
export default function ReviewTabs({ value, onChange }) {
  return (
    <div className="reviewTabs">
      <button
        className={"reviewTab" + (value === "dialogue" ? " active" : "")}
        onClick={() => onChange("dialogue")}
      >
        📖 Dialogue
      </button>
      <button
        className={"reviewTab" + (value === "chrono" ? " active" : "")}
        onClick={() => onChange("chrono")}
      >
        🌗 Chrono Bar
      </button>
    </div>
  );
}
