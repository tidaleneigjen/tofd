import { useState } from "react";
import { signIn } from "aws-amplify/auth";
import { friendlyAuthError } from "./authErrors";

const NEW_PASSWORD_STEP = "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED";

export default function LoginForm({ onSignedIn, onNewPasswordRequired }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await signIn({ username: email.trim(), password });
      if (result.nextStep?.signInStep === NEW_PASSWORD_STEP) {
        onNewPasswordRequired(email.trim());
      } else if (result.isSignedIn) {
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
      <h1>Admin sign in</h1>
      {error && (
        <p className="alert error" role="alert">
          {error}
        </p>
      )}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button type="submit" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
