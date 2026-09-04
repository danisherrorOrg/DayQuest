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
        <div className="modeCard" onClick={() => onPick("cards")}>
          <h3>📇 Log it as cards</h3>
          <p>
            Add each activity as its own card — duration, what you did, a note, a category, and
            tags.
          </p>
        </div>
        <div className="modeCard" onClick={() => onPick("timeline")}>
          <h3>🕒 Drag it on a timeline</h3>
          <p>
            Drag across a 0–24 ruler to block out time for something, resize or move blocks after,
            and leave the rest as black box.
          </p>
        </div>
        <div className="modeCard" onClick={() => onPick("moments")}>
          <h3>📝 List your moments in order</h3>
          <p>Not a time person? Just add what you did, one after another. Times are optional.</p>
        </div>
      </div>
    </div>
  );
}
