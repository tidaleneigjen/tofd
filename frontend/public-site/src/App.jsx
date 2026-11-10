import { useEffect, useState } from "react";
import { DEFAULT_PAGE } from "./defaults";

const DEFAULT_HERO_IMAGE = "/temple-ritual.jpg";

function paragraphs(text) {
  return String(text ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export default function App() {
  const [page, setPage] = useState(null); // null = loading
  const [heroImage, setHeroImage] = useState(DEFAULT_HERO_IMAGE);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/pages/home")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setPage(data);
          if (data.heroImageUrl) setHeroImage(data.heroImageUrl);
        }
      })
      .catch(() => {
        if (!cancelled) setPage(DEFAULT_PAGE);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.title = "Temple of the Feminine Divine";
  }, []);

  if (!page) {
    return (
      <main className="page">
        <p className="loading">Loading…</p>
      </main>
    );
  }

  const heroHeading = page.heroHeading || DEFAULT_PAGE.heroHeading;

  return (
    <main className="page">
      <img className="hero-image" src={heroImage} alt={`A ritual gathering — ${heroHeading}`} />
      <h1>{heroHeading}</h1>
      <p className="mission">{page.missionStatement || DEFAULT_PAGE.missionStatement}</p>
      {paragraphs(page.body || DEFAULT_PAGE.body).map((para, i) => (
        <p key={i}>{para}</p>
      ))}
    </main>
  );
}
