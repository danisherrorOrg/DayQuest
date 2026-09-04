import { useAuth } from "../../context/AuthContext.jsx";

export default function ModeSelectScreen({ onPick }) {
  const { email, logout } = useAuth();

  return (
    <div className="screen active">
      <div className="panel">
        <div className="topBar">
          <span className="topBarEmail">{email}</span>
          <button className="backLink" onClick={logout}>
            Log out
          </button>
        </div>
        <h1>Day Story: Run Your Day</h1>
        <p className="sub">
          Choose how you want to log today. Either way, unlogged time just becomes a black box in
          the level — no pressure to remember everything.
        </p>
        <div className="modeCard" onClick={() => onPick("text")}>
          <h3>✍️ Write it out</h3>
          <p>Type your day using a simple time format, minute by minute or task by task.</p>
        </div>
        <div className="modeCard" onClick={() => onPick("timeline")}>
          <h3>🕒 Build it on a timeline</h3>
          <p>Go through 0–24 hours and tap in what you were doing, half hour by half hour.</p>
        </div>
        <div className="modeCard" onClick={() => onPick("moments")}>
          <h3>📝 List your moments in order</h3>
          <p>Not a time person? Just add what you did, one after another. Times are optional.</p>
        </div>
      </div>
    </div>
  );
}
