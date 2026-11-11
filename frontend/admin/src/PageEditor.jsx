import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";
import { API_BASE_URL } from "./amplify";
import { PAGE_DEFAULTS } from "./defaults";
import { friendlyApiError } from "./authErrors";
import { GENERIC_PAGES } from "./pages";
import RichTextEditor from "./RichTextEditor";

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Legacy plain-text bodies (bodyFormat "text") become paragraphs for the
// rich editor; anything else is passed through as stored HTML.
function bodyToEditorHtml(item) {
  const raw = typeof item?.body === "string" ? item.body : "";
  if (item?.bodyFormat === "text") {
    const paragraphs = raw
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    return paragraphs
      .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
      .join("");
  }
  return raw;
}

function PageEditor({ slug, label }) {
  const [initial, setInitial] = useState(null); // { title, body } loaded once
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetch(`${API_BASE_URL}/api/pages/${slug}`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 404) {
          // Never saved — prefill defaults (if any), don't save until Save.
          const fallback = PAGE_DEFAULTS[slug] ?? { title: "", body: "" };
          setInitial({ title: fallback.title, body: fallback.body });
          setTitle(fallback.title);
          setBody(fallback.body);
          setStatus("ready");
          return;
        }
        if (!res.ok) {
          const responseBody = await res.json().catch(() => ({}));
          throw { status: res.status, body: responseBody };
        }
        const item = await res.json();
        if (cancelled) return;
        const next = {
          title: typeof item?.title === "string" ? item.title : "",
          body: bodyToEditorHtml(item),
        };
        setInitial(next);
        setTitle(next.title);
        setBody(next.body);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(friendlyApiError(err?.status ?? 0, err?.body));
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [slug, reloadKey]);

  function clearMessages() {
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
      const res = await fetch(`${API_BASE_URL}/api/pages/${slug}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: title.trim(), body }),
      });
      if (res.ok) {
        setNotice("Saved — your changes are live on the site");
      } else {
        const responseBody = await res.json().catch(() => ({}));
        setSaveError(friendlyApiError(res.status, responseBody));
      }
    } catch {
      setSaveError("Can't reach the server. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <h1 className="page-heading">Edit {label}</h1>

      {status === "loading" && <p className="muted">Loading…</p>}

      {status === "error" && (
        <div className="card">
          <p className="alert error" role="alert">
            {error}
          </p>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)}>
            Try again
          </button>
        </div>
      )}

      {status === "ready" && initial && (
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
            <label htmlFor="page-title">Title</label>
            <input
              id="page-title"
              required
              maxLength={200}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                clearMessages();
              }}
            />
          </div>

          <div className="field">
            <span className="field-label" id="page-body-label">
              Content
            </span>
            <RichTextEditor
              initialHtml={initial.body}
              labelledBy="page-body-label"
              onChange={(html) => {
                setBody(html);
                clearMessages();
              }}
            />
            <p className="hint">Use the toolbar for headings, lists, quotes, and links.</p>
          </div>

          <button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
      )}
    </section>
  );
}

// Route wrapper: remount the editor (and its TipTap instance) when the slug
// param changes so stale content never leaks between pages.
export default function RoutedPageEditor() {
  const { slug } = useParams();
  const meta = GENERIC_PAGES.find((page) => page.slug === slug);
  if (!meta) return <Navigate to="/" replace />;
  return <PageEditor key={slug} slug={slug} label={meta.label} />;
}
