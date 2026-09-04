import { useState } from "react";

export default function TextModeScreen({ onBack, onBuild }) {
  const [text, setText] = useState("");

  return (
    <div className="screen active">
      <div className="panel">
        <div className="backRow">
          <button className="backLink" onClick={onBack}>
            ← Back
          </button>
        </div>
        <h1>Write Your Day</h1>
        <p className="sub">One line per block of time. Anything not covered becomes a black box.</p>
        <div className="formatBox">
          <b>Format: HH:MM-HH:MM what you did</b>
          06:30-07:00 gym
          <br />
          07:00-07:30 breakfast with family
          <br />
          09:00-12:30 work
          <br />
          13:00-13:45 lunch
          <br />
          20:00-20:30 read before bed
        </div>
        <textarea
          id="dayText"
          placeholder={"06:30-07:00 gym\n07:00-07:30 breakfast\n09:00-12:30 work\n..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div style={{ height: 12 }} />
        <button
          className="primaryBtn"
          disabled={text.trim().length === 0}
          onClick={() => onBuild(text)}
        >
          Build My Level
        </button>
        <p className="sub" style={{ marginTop: 10 }}>
          No timestamps? That&apos;s fine too — just describe your day in plain English and
          I&apos;ll pull out the activities.
        </p>
      </div>
    </div>
  );
}
