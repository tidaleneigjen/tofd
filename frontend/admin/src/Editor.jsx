import { useEffect, useState } from "react";
import { fetchAuthSession, signOut } from "aws-amplify/auth";
import { API_BASE_URL } from "./amplify";
import { DEFAULT_PAGE } from "./defaults";
import { friendlyApiError } from "./authErrors";

export default function Editor({ onSignedOut }) {
  const [form, setForm] = useState(null);
  const [loadState, setLoadState] = useState("loading"); // loading | ready | error
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/pages/home`);
        if (cancelled) return;
        if (res.status === 404) {
          // No page saved yet — prefill defaults, don't save until the user does.
          setForm({ title: "", ...DEFAULT_PAGE });
          setLoadState("ready");
          return;
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw { status: res.status, body };
        }
        const data = await res.json();
        if (cancelled) return;
        setForm({
          title: data.title ?? "",
          heroHeading: data.heroHeading ?? "",
          missionStatement: data.missionStatement ?? "",
          body: data.body ?? "",
        });
        setLoadState("ready");
      } catch (err) {
        if (cancelled) return;
        setLoadError(friendlyApiError(err?.status ?? 0, err?.body));
        setLoadState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setNotice("");
    setSaveError("");
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    setSaveError("");
    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      if (!idToken) {
        setSaveError("Your session has expired. Please sign in again.");
        return;
      }
      const payload = {
        heroHeading: form.heroHeading,
        missionStatement: form.missionStatement,
        body: form.body,
      };
      // title isn't editable in Phase 1, but preserve it if one exists.
      if (form.title) payload.title = form.title;

      const res = await fetch(`${API_BASE_URL}/pages/home`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setForm((f) => ({ ...f, title: data.title ?? f.title }));
        setNotice("Saved — your changes are live on the site");
      } else {
        const body = await res.json().catch(() => ({}));
        setSaveError(friendlyApiError(res.status, body));
      }
    } catch {
      setSaveError("Can't reach the server. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
    } finally {
      onSignedOut();
    }
  }

  return (
    <div className="page">
      <header className="topbar">
        <h1>Edit Homepage</h1>
        <button type="button" className="link" onClick={handleSignOut}>
          Sign out
        </button>
      </header>

      {loadState === "loading" && <p className="muted">Loading…</p>}

      {loadState === "error" && (
        <div className="card">
          <p className="alert error" role="alert">
            {loadError}
          </p>
          <button
            type="button"
            onClick={() => {
              setLoadState("loading");
              setLoadError("");
              // Re-run the load by remounting is overkill — reload page data.
              window.location.reload();
            }}
          >
            Try again
          </button>
        </div>
      )}

      {loadState === "ready" && form && (
        <form className="card" onSubmit={handleSave}>
          {notice && (
            <p className="alert success" role="status">
              {notice}
            </p>
          )}
          {saveError && (
            <p className="alert error" role="alert">
              {saveError}
            </p>
          )}

          <div className="field">
            <label htmlFor="heroHeading">Hero heading</label>
            <input
              id="heroHeading"
              required
              maxLength={200}
              value={form.heroHeading}
              onChange={(e) => update("heroHeading", e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="missionStatement">Mission statement</label>
            <textarea
              id="missionStatement"
              required
              rows={5}
              maxLength={2000}
              value={form.missionStatement}
              onChange={(e) => update("missionStatement", e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="body">Body</label>
            <textarea
              id="body"
              required
              rows={8}
              maxLength={20000}
              value={form.body}
              onChange={(e) => update("body", e.target.value)}
            />
            <p className="hint">Separate paragraphs with a blank line.</p>
          </div>

          <button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
      )}
    </div>
  );
}
