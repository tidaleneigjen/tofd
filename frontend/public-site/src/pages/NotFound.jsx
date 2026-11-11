import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SITE_NAME } from "../site";

export default function NotFound() {
  useEffect(() => {
    document.title = `Page not found — ${SITE_NAME}`;
  }, []);

  return (
    <article className="page-card">
      <h2 className="page-title">Page not found</h2>
      <p>Sorry, that page doesn&apos;t exist.</p>
      <p>
        <Link to="/">Return to the homepage</Link>
      </p>
    </article>
  );
}
