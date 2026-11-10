import { useState } from "react";
import { confirmSignIn } from "aws-amplify/auth";
import { friendlyAuthError } from "./authErrors";

export default function NewPasswordForm({ email, onSignedIn, onBack }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const result = await confirmSignIn({ challengeResponse: password });
      if (result.isSignedIn) {
        onSignedIn();
      } else {
        setError("Additional verification is required. Please contact an administrator.");
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h1>Choose a new password</h1>
      <p className="muted">
        Welcome, {email}. For security, please set a new password. It must be at
        least 12 characters and include uppercase, lowercase, a number, and a
        symbol.
      </p>
      {error && (
        <p className="alert error" role="alert">
          {error}
        </p>
      )}
      <div className="field">
        <label htmlFor="new-password">New password</label>
        <input
          id="new-password"
          name="new-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="confirm-password">Confirm new password</label>
        <input
          id="confirm-password"
          name="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      <button type="submit" disabled={busy}>
        {busy ? "Saving…" : "Set password and continue"}
      </button>
      <button type="button" className="link" onClick={onBack}>
        Back to sign in
      </button>
    </form>
  );
}
