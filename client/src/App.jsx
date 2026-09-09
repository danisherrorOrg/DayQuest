import { useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import LoginForm from "./components/auth/LoginForm.jsx";
import RegisterForm from "./components/auth/RegisterForm.jsx";
import ForgotPasswordForm from "./components/auth/ForgotPasswordForm.jsx";
import ResetPasswordForm from "./components/auth/ResetPasswordForm.jsx";
import VerifyEmailScreen from "./components/auth/VerifyEmailScreen.jsx";
import VerifyEmailBanner from "./components/auth/VerifyEmailBanner.jsx";
import OfflineBanner from "./components/OfflineBanner.jsx";
import ModeSelectScreen from "./components/screens/ModeSelectScreen.jsx";
import MyDaysScreen from "./components/screens/MyDaysScreen.jsx";
import SettingsScreen from "./components/screens/SettingsScreen.jsx";
import LogCardModeScreen from "./components/screens/LogCardModeScreen.jsx";
import TimelineBuilderScreen from "./components/screens/TimelineBuilderScreen.jsx";
import DialogueRecapScreen from "./components/screens/DialogueRecapScreen.jsx";
import ChronoBarScreen from "./components/screens/ChronoBarScreen.jsx";
import { usePendingSaveFlush } from "./hooks/usePendingSaveFlush.js";
import { todayDateString } from "./game/date.js";

// Maps a ModeSelectScreen pick ("cards" | "timeline" | "days" | "settings")
// to the real path it now lives at.
const MODE_PICK_PATH = { cards: "/log", timeline: "/timeline", days: "/days", settings: "/settings" };

function GameApp() {
  const justSynced = usePendingSaveFlush();
  const navigate = useNavigate();
  const [run, setRun] = useState(null); // { mode, cards, blocks, replay? }
  const [timelineJump, setTimelineJump] = useState(null); // { anchorMinutes } | null

  function handleBuildFromLogCards(cards) {
    setRun({ mode: "cards", cards, date: todayDateString() });
    navigate("/recap");
  }

  function handleBuildFromBuilderBlocks(blocks) {
    setRun({ mode: "builder", blocks, date: todayDateString() });
    navigate("/recap");
  }

  function handleRestart() {
    setRun(null);
    setTimelineJump(null);
    navigate("/");
  }

  // Opens a previously saved day (from MyDaysScreen) in the review screens,
  // read-only — no save button, and "back" returns to the list instead of
  // resetting to a fresh entry.
  function handleReplayDay(day) {
    setRun({
      mode: day.mode,
      cards: day.logCards || [],
      blocks: day.timelineBlocks || [],
      date: day.date,
      replay: true,
    });
    navigate("/recap");
  }

  function handleExitReplay() {
    setRun(null);
    setTimelineJump(null);
    navigate("/days");
  }

  // The chrono bar's "tap empty space" shortcut: only offered in builder
  // mode, since timeline blocks are the only entry-mode data shape that can
  // be carried back into the builder and re-edited without losing anything.
  function handleJumpToBuilder(minutes) {
    setTimelineJump({ anchorMinutes: minutes });
    navigate("/timeline");
  }

  function handleTimelineBack() {
    if (timelineJump) {
      setTimelineJump(null);
      navigate("/recap");
    } else {
      navigate("/");
    }
  }

  function handleTimelineBuild(blocks) {
    setTimelineJump(null);
    handleBuildFromBuilderBlocks(blocks);
  }

  function handleChangeReviewView(view) {
    navigate(view === "chrono" ? "/recap/chrono" : "/recap");
  }

  return (
    <div id="app">
      {justSynced && <div className="syncBanner">✓ Back online — your saved day went through.</div>}
      <VerifyEmailBanner />
      <Routes>
        <Route
          index
          element={<ModeSelectScreen onPick={(screen) => navigate(MODE_PICK_PATH[screen])} />}
        />
        <Route
          path="days"
          element={<MyDaysScreen onBack={() => navigate("/")} onSelectDay={handleReplayDay} />}
        />
        <Route path="settings" element={<SettingsScreen onBack={() => navigate("/")} />} />
        <Route
          path="log"
          element={<LogCardModeScreen onBack={() => navigate("/")} onBuild={handleBuildFromLogCards} />}
        />
        <Route
          path="timeline"
          element={
            <TimelineBuilderScreen
              onBack={handleTimelineBack}
              onBuild={handleTimelineBuild}
              initialBlocks={timelineJump && run?.mode === "builder" ? run.blocks : []}
              initialAnchorMinutes={timelineJump ? timelineJump.anchorMinutes : null}
            />
          }
        />
        <Route
          path="recap"
          element={
            run ? (
              <DialogueRecapScreen
                mode={run.mode}
                cards={run.cards}
                blocks={run.blocks}
                date={run.date}
                onRestart={run.replay ? handleExitReplay : handleRestart}
                replay={run.replay}
                reviewView="dialogue"
                onChangeReviewView={handleChangeReviewView}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="recap/chrono"
          element={
            run ? (
              <ChronoBarScreen
                mode={run.mode}
                cards={run.cards}
                blocks={run.blocks}
                date={run.date}
                onRestart={run.replay ? handleExitReplay : handleRestart}
                replay={run.replay}
                reviewView="chrono"
                onChangeReviewView={handleChangeReviewView}
                onJumpToBuilder={!run.replay && run.mode === "builder" ? handleJumpToBuilder : undefined}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <OfflineBanner />
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/forgot-password" element={<ForgotPasswordForm />} />
        <Route path="/reset-password" element={<ResetPasswordForm />} />
        <Route path="/verify-email" element={<VerifyEmailScreen />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <GameApp />
            </RequireAuth>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
