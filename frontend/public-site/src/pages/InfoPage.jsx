import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import RichText from "../components/RichText";
import { PAGE_DEFAULTS } from "../defaults";
import { INFO_PAGES, SITE_NAME } from "../site";
import NotFound from "./NotFound";

function paragraphs(text) {
  return String(text ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export default function InfoPage() {
  const { slug } = useParams();
  const label = INFO_PAGES[slug];
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [item, setItem] = useState(null); // null = never saved (404)
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!label) return;
    let cancelled = false;
    setStatus("loading");
    setItem(null);
    fetch(`/api/pages/${slug}`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 404) {
          setStatus("ready");
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setItem(data);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [slug, label, reloadKey]);

  // Resolve what to show once the fetch settles. A saved item wins; a 404
  // falls back to the page's default copy (if any); otherwise coming soon.
  let title = label;
  let body = null;
  let bodyFormat = "html";
  let comingSoon = false;
  if (status === "ready") {
    if (item && typeof item.body === "string" && item.body.trim() !== "") {
      title = typeof item.title === "string" && item.title ? item.title : label;
      body = item.body;
      bodyFormat = item.bodyFormat === "text" ? "text" : "html";
    } else {
      const fallback = item ? null : PAGE_DEFAULTS[slug];
      if (fallback) {
        title = fallback.title;
        body = fallback.body;
      } else {
        comingSoon = true;
      }
    }
  }

  useEffect(() => {
    if (label) document.title = `${title} — ${SITE_NAME}`;
  }, [label, title, status]);

  if (!label) return <NotFound />;
  if (status === "loading") return <div className="page--loading">Loading…</div>;

  if (status === "error") {
    return (
      <article className="page-card">
        <h2 className="page-title">{label}</h2>
        <p>Couldn&apos;t load this page right now.</p>
        <button
          type="button"
          className="page-card-button"
          onClick={() => setReloadKey((key) => key + 1)}
        >
          Try again
        </button>
      </article>
    );
  }

  if (comingSoon) {
    return (
      <article className="page-card">
        <h2 className="page-title">{label}</h2>
        <p className="coming-soon">Content coming soon.</p>
      </article>
    );
  }

  return (
    <article className="page-card">
      <h2 className="page-title">{title}</h2>
      {bodyFormat === "text" ? (
        paragraphs(body).map((para, i) => <p key={i}>{para}</p>)
      ) : (
        <RichText html={body} />
      )}
    </article>
  );
}
