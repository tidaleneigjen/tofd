import { useEffect, useState } from "react";
import Carousel from "../components/Carousel";
import { DEFAULT_PAGE } from "../defaults";
import { SITE_NAME } from "../site";

function paragraphs(text) {
  return String(text ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

// Fall back to defaults per missing part: a legacy Phase 1 item (no
// slides/sidebar) or a partially-filled item still renders.
function mergeWithDefaults(data) {
  const slides =
    Array.isArray(data?.slides) && data.slides.length > 0 ? data.slides : DEFAULT_PAGE.slides;
  const sidebar =
    data?.sidebar && typeof data.sidebar.title === "string" && typeof data.sidebar.text === "string"
      ? data.sidebar
      : DEFAULT_PAGE.sidebar;
  return { slides, sidebar };
}

export default function HomePage() {
  const [page, setPage] = useState(null); // null = loading

  useEffect(() => {
    let cancelled = false;
    fetch("/api/pages/home")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setPage(mergeWithDefaults(data));
      })
      .catch(() => {
        if (!cancelled) setPage(DEFAULT_PAGE);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.title = SITE_NAME;
  }, []);

  if (page === null) {
    return <div className="page--loading">Loading…</div>;
  }

  return (
    <div className="home-grid">
      <Carousel slides={page.slides} />
      <aside className="sidebar">
        <h2 className="sidebar-title">{page.sidebar.title}</h2>
        {paragraphs(page.sidebar.text).map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </aside>
    </div>
  );
}
