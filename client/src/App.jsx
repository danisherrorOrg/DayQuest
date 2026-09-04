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
import LogCardModeScreen from "./components/screens/LogCardModeScreen.jsx";
import TimelineModeScreen from "./components/screens/TimelineModeScreen.jsx";
import MomentsModeScreen from "./components/screens/MomentsModeScreen.jsx";
import GameScreen from "./components/screens/GameScreen.jsx";
import {
  buildLevelFromTimeline,
  buildLevelFromMoments,
  buildLevelFromLogCards,
  timelineFromSlots,
} from "./game/levelBuilder.js";

function GameApp() {
  const [screen, setScreen] = useState("mode");
  const [run, setRun] = useState(null); // { mode, timeline, cards, moments, builtLevel }

  function handleBuildFromLogCards(cards) {
    setRun({ mode: "cards", cards, builtLevel: buildLevelFromLogCards(cards) });
    setScreen("game");
  }

  function handleBuildFromTimeline(slots) {
    const tl = timelineFromSlots(slots);
    setRun({ mode: "timed", timeline: tl, builtLevel: buildLevelFromTimeline(tl) });
    setScreen("game");
  }

  function handleBuildFromMoments(moments) {
    setRun({ mode: "sequence", moments, builtLevel: buildLevelFromMoments(moments) });
    setScreen("game");
  }

  function handleRestart() {
    setRun(null);
    setScreen("mode");
  }

  return (
    <div id="app">
      <VerifyEmailBanner />
      {screen === "mode" && <ModeSelectScreen onPick={setScreen} />}
      {screen === "cards" && (
        <LogCardModeScreen onBack={() => setScreen("mode")} onBuild={handleBuildFromLogCards} />
      )}
      {screen === "timeline" && (
        <TimelineModeScreen onBack={() => setScreen("mode")} onBuild={handleBuildFromTimeline} />
      )}
      {screen === "moments" && (
        <MomentsModeScreen onBack={() => setScreen("mode")} onBuild={handleBuildFromMoments} />
      )}
      {screen === "game" && run && (
        <GameScreen
          mode={run.mode}
          timeline={run.timeline}
          cards={run.cards}
          moments={run.moments}
          builtLevel={run.builtLevel}
          onRestart={handleRestart}
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
