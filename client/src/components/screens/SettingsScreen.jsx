import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";

export default function SettingsScreen({ onBack }) {
  const { changePassword, deleteAccount, remindersEnabled, updateReminders } = useAuth();

  const [reminderSaving, setReminderSaving] = useState(false);
  const [reminderError, setReminderError] = useState(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pwError, setPwError] = useState(null);
  const [pwSuccess, setPwSuccess] = useState(null);
  const [pwSubmitting, setPwSubmitting] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);
    if (newPassword !== confirmNewPassword) {
      setPwError("New passwords do not match");
      return;
    }
    setPwSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPwSuccess("Password changed.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwSubmitting(false);
    }
  }

  async function handleToggleReminders() {
    setReminderError(null);
    setReminderSaving(true);
    try {
      await updateReminders(!remindersEnabled);
    } catch (err) {
      setReminderError(err.message);
    } finally {
      setReminderSaving(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteAccount(deletePassword);
      // deleteAccount clears the session on success; RequireAuth redirects to /login.
    } catch (err) {
      setDeleteError(err.message);
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  return (
    <div className="screen active">
      <div className="panel">
        <div className="backRow">
          <button className="backLink" onClick={onBack}>
            ← Back
          </button>
        </div>
        <h1 style={{ marginBottom: 2 }}>Account Settings</h1>

        <div style={{ flex: 1, overflowY: "auto" }}>
          <h3>Change Password</h3>
          <form onSubmit={handleChangePassword}>
            <input
              className="authInput"
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <input
              className="authInput"
              type="password"
              placeholder="New password (min 8 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <input
              className="authInput"
              type="password"
              placeholder="Confirm new password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            {pwError && <p className="authError">{pwError}</p>}
            {pwSuccess && <p className="authSuccess">{pwSuccess}</p>}
            <button
              className="primaryBtn"
              type="submit"
              disabled={pwSubmitting}
              style={{ width: "100%" }}
            >
              {pwSubmitting ? "Changing…" : "Change Password"}
            </button>
          </form>

          <h3 style={{ marginTop: 24 }}>Reminders</h3>
          <p className="sub">A daily email if you haven&apos;t logged today yet.</p>
          {reminderError && <p className="authError">{reminderError}</p>}
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={remindersEnabled}
              disabled={reminderSaving}
              onChange={handleToggleReminders}
            />
            <span className="sub" style={{ margin: 0 }}>
              {remindersEnabled ? "Reminder emails are on" : "Reminder emails are off"}
            </span>
          </label>

          <h3 style={{ marginTop: 24 }}>Delete Account</h3>
          <p className="sub">Permanently deletes your account and every day you&apos;ve saved.</p>
          <input
            className="authInput"
            type="password"
            placeholder="Confirm your password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            autoComplete="current-password"
          />
          {deleteError && <p className="authError">{deleteError}</p>}
          <button
            className="ghostBtn"
            style={{ width: "100%" }}
            disabled={!deletePassword}
            onClick={() => {
              setDeleteError(null);
              setConfirmingDelete(true);
            }}
          >
            Delete Account
          </button>
        </div>
      </div>

      {confirmingDelete && (
        <div
          className="builderPopupBackdrop"
          onClick={() => !deleting && setConfirmingDelete(false)}
        >
          <div className="builderPopupSheet" onClick={(e) => e.stopPropagation()}>
            <div className="builderPopupHead">
              <span>Delete your account?</span>
            </div>
            <p className="sub" style={{ marginTop: 8 }}>
              This permanently deletes your account and every day you&apos;ve saved. This can&apos;t
              be undone.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                className="primaryBtn"
                style={{ flex: 1 }}
                disabled={deleting}
                onClick={handleDeleteAccount}
              >
                {deleting ? "Deleting…" : "Delete Account"}
              </button>
              <button
                className="ghostBtn"
                disabled={deleting}
                onClick={() => setConfirmingDelete(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
