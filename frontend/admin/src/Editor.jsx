import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { API_BASE_URL } from "./amplify";
import { DEFAULT_PAGE, SLIDE_IMAGES } from "./defaults";
import { friendlyApiError } from "./authErrors";
import {
  MAX_SLIDES,
  addSlide,
  moveSlide,
  removeSlide,
  slideForSave,
  updateSlide,
} from "./slideList";

function mergeWithDefaults(data) {
  const slides =
    Array.isArray(data?.slides) && data.slides.length > 0 ? data.slides : DEFAULT_PAGE.slides;
  const sidebar =
    data?.sidebar && typeof data.sidebar.title === "string" && typeof data.sidebar.text === "string"
      ? data.sidebar
      : DEFAULT_PAGE.sidebar;
  return { slides, sidebar };
}

export default function Editor() {
  const [form, setForm] = useState(null); // { slides: [...], sidebar: {...} }
  const [loadState, setLoadState] = useState("loading"); // loading | ready | error
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/pages/home`);
        if (cancelled) return;
        if (res.status === 404) {
          // No page saved yet — prefill defaults, don't save until the user does.
          setForm(DEFAULT_PAGE);
          setLoadState("ready");
          return;
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw { status: res.status, body };
        }
        const data = await res.json();
        if (cancelled) return;
        setForm(mergeWithDefaults(data));
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

  function clearMessages() {
    setNotice("");
    setSaveError("");
  }

  function updateSlideField(index, field, value) {
    setForm((f) => ({ ...f, slides: updateSlide(f.slides, index, field, value) }));
    clearMessages();
  }

  function updateSidebar(field, value) {
    setForm((f) => ({ ...f, sidebar: { ...f.sidebar, [field]: value } }));
    clearMessages();
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
        slides: form.slides.map(slideForSave),
        sidebar: { title: form.sidebar.title, text: form.sidebar.text },
      };

      const res = await fetch(`${API_BASE_URL}/api/pages/home`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
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

  const slideCount = form?.slides.length ?? 0;
  const knownImages = new Set(SLIDE_IMAGES.map((img) => img.value));

  return (
    <section>
      <h1 className="page-heading">Edit Homepage</h1>

      {loadState === "loading" && <p className="muted">Loading…</p>}

      {loadState === "error" && (
        <div className="card">
          <p className="alert error" role="alert">
            {loadError}
          </p>
          <button type="button" onClick={() => window.location.reload()}>
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

          <h2 className="section-title">Carousel slides</h2>
          <p className="hint">Slides rotate automatically on the homepage. 1–{MAX_SLIDES} slides.</p>

          {form.slides.map((slide, i) => (
            <fieldset className="slide-editor" key={i}>
              <legend>
                Slide {i + 1}
                <span className="slide-editor-actions">
                  <button
                    type="button"
                    className="small"
                    disabled={i === 0}
                    onClick={() => {
                      setForm((f) => ({ ...f, slides: moveSlide(f.slides, i, -1) }));
                      clearMessages();
                    }}
                  >
                    Move up
                  </button>
                  <button
                    type="button"
                    className="small"
                    disabled={i === slideCount - 1}
                    onClick={() => {
                      setForm((f) => ({ ...f, slides: moveSlide(f.slides, i, 1) }));
                      clearMessages();
                    }}
                  >
                    Move down
                  </button>
                  <button
                    type="button"
                    className="small danger"
                    disabled={slideCount <= 1}
                    onClick={() => {
                      setForm((f) => ({ ...f, slides: removeSlide(f.slides, i) }));
                      clearMessages();
                    }}
                  >
                    Remove
                  </button>
                </span>
              </legend>

              <div className="field">
                <label htmlFor={`slide-image-${i}`}>Image</label>
                <div className="image-picker">
                  <select
                    id={`slide-image-${i}`}
                    value={slide.imageUrl}
                    onChange={(e) => updateSlideField(i, "imageUrl", e.target.value)}
                  >
                    {SLIDE_IMAGES.map((img) => (
                      <option key={img.value} value={img.value}>
                        {img.label}
                      </option>
                    ))}
                    {!knownImages.has(slide.imageUrl) && (
                      <option value={slide.imageUrl}>{slide.imageUrl}</option>
                    )}
                  </select>
                  <img className="image-preview" src={slide.imageUrl} alt="" />
                </div>
              </div>

              <div className="field">
                <label htmlFor={`slide-title-${i}`}>Title (optional)</label>
                <input
                  id={`slide-title-${i}`}
                  maxLength={100}
                  value={slide.title ?? ""}
                  onChange={(e) => updateSlideField(i, "title", e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor={`slide-text-${i}`}>Text (optional)</label>
                <textarea
                  id={`slide-text-${i}`}
                  rows={4}
                  maxLength={1000}
                  value={slide.text ?? ""}
                  onChange={(e) => updateSlideField(i, "text", e.target.value)}
                />
                <p className="hint">Blank lines create paragraphs on the slide.</p>
              </div>
            </fieldset>
          ))}

          <button
            type="button"
            className="secondary"
            disabled={slideCount >= MAX_SLIDES}
            onClick={() => {
              setForm((f) => ({ ...f, slides: addSlide(f.slides) }));
              clearMessages();
            }}
          >
            Add slide
          </button>

          <h2 className="section-title">Sidebar</h2>

          <div className="field">
            <label htmlFor="sidebar-title">Title</label>
            <input
              id="sidebar-title"
              required
              maxLength={100}
              value={form.sidebar.title}
              onChange={(e) => updateSidebar("title", e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="sidebar-text">Text</label>
            <textarea
              id="sidebar-text"
              required
              rows={6}
              maxLength={3000}
              value={form.sidebar.text}
              onChange={(e) => updateSidebar("text", e.target.value)}
            />
            <p className="hint">Blank lines create paragraphs.</p>
          </div>

          <button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
      )}
    </section>
  );
}
