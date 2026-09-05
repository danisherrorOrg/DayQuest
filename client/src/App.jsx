import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
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

function GameApp() {
  const justSynced = usePendingSaveFlush();
  const [screen, setScreen] = useState("mode");
  const [run, setRun] = useState(null); // { mode, cards, blocks, replay? }
  const [reviewView, setReviewView] = useState("dialogue");
  const [timelineJump, setTimelineJump] = useState(null); // { anchorMinutes } | null

  function handleBuildFromLogCards(cards) {
    setRun({ mode: "cards", cards });
    setScreen("recap");
  }

  function handleBuildFromBuilderBlocks(blocks) {
    setRun({ mode: "builder", blocks });
    setScreen("recap");
  }

  function handleRestart() {
    setRun(null);
    setTimelineJump(null);
    setReviewView("dialogue");
    setScreen("mode");
  }

  // Opens a previously saved day (from MyDaysScreen) in the review screens,
  // read-only — no save button, and "back" returns to the list instead of
  // resetting to a fresh entry.
  function handleReplayDay(day) {
    setRun({
      mode: day.mode,
      cards: day.logCards || [],
      blocks: day.timelineBlocks || [],
      replay: true,
    });
    setReviewView("dialogue");
    setScreen("recap");
  }

  function handleExitReplay() {
    setRun(null);
    setTimelineJump(null);
    setReviewView("dialogue");
    setScreen("days");
  }

  // The chrono bar's "tap empty space" shortcut: only offered in builder
  // mode, since timeline blocks are the only entry-mode data shape that can
  // be carried back into the builder and re-edited without losing anything.
  function handleJumpToBuilder(minutes) {
    setTimelineJump({ anchorMinutes: minutes });
    setScreen("timeline");
  }

  function handleTimelineBack() {
    if (timelineJump) {
      setTimelineJump(null);
      setScreen("recap");
    } else {
      setScreen("mode");
    }
  }

  function handleTimelineBuild(blocks) {
    setTimelineJump(null);
    handleBuildFromBuilderBlocks(blocks);
  }

  return (
    <div id="app">
      {justSynced && <div className="syncBanner">✓ Back online — your saved day went through.</div>}
      <VerifyEmailBanner />
      {screen === "mode" && <ModeSelectScreen onPick={setScreen} />}
      {screen === "days" && (
        <MyDaysScreen onBack={() => setScreen("mode")} onSelectDay={handleReplayDay} />
      )}
      {screen === "settings" && <SettingsScreen onBack={() => setScreen("mode")} />}
      {screen === "cards" && (
        <LogCardModeScreen onBack={() => setScreen("mode")} onBuild={handleBuildFromLogCards} />
      )}
      {screen === "timeline" && (
        <TimelineBuilderScreen
          onBack={handleTimelineBack}
          onBuild={handleTimelineBuild}
          initialBlocks={timelineJump && run?.mode === "builder" ? run.blocks : []}
          initialAnchorMinutes={timelineJump ? timelineJump.anchorMinutes : null}
        />
      )}
      {screen === "recap" && run && reviewView === "dialogue" && (
        <DialogueRecapScreen
          mode={run.mode}
          cards={run.cards}
          blocks={run.blocks}
          onRestart={run.replay ? handleExitReplay : handleRestart}
          replay={run.replay}
          reviewView={reviewView}
          onChangeReviewView={setReviewView}
        />
      )}
      {screen === "recap" && run && reviewView === "chrono" && (
        <ChronoBarScreen
          mode={run.mode}
          cards={run.cards}
          blocks={run.blocks}
          onRestart={run.replay ? handleExitReplay : handleRestart}
          replay={run.replay}
          reviewView={reviewView}
          onChangeReviewView={setReviewView}
          onJumpToBuilder={!run.replay && run.mode === "builder" ? handleJumpToBuilder : undefined}
        />
      )}
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
          path="/"
          element={
            <RequireAuth>
              <GameApp />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
