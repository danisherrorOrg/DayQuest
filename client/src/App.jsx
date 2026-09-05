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
import TimelineBuilderScreen from "./components/screens/TimelineBuilderScreen.jsx";
import MomentsModeScreen from "./components/screens/MomentsModeScreen.jsx";
import DialogueRecapScreen from "./components/screens/DialogueRecapScreen.jsx";

function GameApp() {
  const [screen, setScreen] = useState("mode");
  const [run, setRun] = useState(null); // { mode, cards, blocks, moments }

  function handleBuildFromLogCards(cards) {
    setRun({ mode: "cards", cards });
    setScreen("recap");
  }

  function handleBuildFromBuilderBlocks(blocks) {
    setRun({ mode: "builder", blocks });
    setScreen("recap");
  }

  function handleBuildFromMoments(moments) {
    setRun({ mode: "sequence", moments });
    setScreen("recap");
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
        <TimelineBuilderScreen
          onBack={() => setScreen("mode")}
          onBuild={handleBuildFromBuilderBlocks}
        />
      )}
      {screen === "moments" && (
        <MomentsModeScreen onBack={() => setScreen("mode")} onBuild={handleBuildFromMoments} />
      )}
      {screen === "recap" && run && (
        <DialogueRecapScreen
          mode={run.mode}
          cards={run.cards}
          blocks={run.blocks}
          moments={run.moments}
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
