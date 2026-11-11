import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "./amplify";
import { friendlyApiError } from "./authErrors";
import { PAGES } from "./pages";

function formatUpdatedAt(iso) {
  if (typeof iso !== "string" || !iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function PagesList() {
  const [items, setItems] = useState(null); // slug -> {title, updatedAt}
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetch(`${API_BASE_URL}/api/pages`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw { status: res.status, body };
        }
        return res.json();
      })
      .then((list) => {
        if (cancelled) return;
        setItems(Object.fromEntries((Array.isArray(list) ? list : []).map((i) => [i.slug, i])));
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
  }, [reloadKey]);

  return (
    <section>
      <h1 className="page-heading">Pages</h1>
      <p className="muted">Choose a page to edit. Pages show &quot;Not yet written&quot; until they&apos;re saved for the first time.</p>

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

      {status === "ready" && (
        <div className="card">
          <table className="pages-table">
            <thead>
              <tr>
                <th scope="col">Page</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="visually-hidden">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {PAGES.map((page) => {
                const item = items?.[page.slug];
                const updated = item ? formatUpdatedAt(item.updatedAt) : null;
                return (
                  <tr key={page.slug}>
                    <td>
                      <Link className="page-link" to={`/pages/${page.slug}`}>
                        {page.label}
                      </Link>
                    </td>
                    <td className="muted">
                      {item ? `Last updated ${updated ?? "recently"}` : "Not yet written"}
                    </td>
                    <td className="pages-table-edit">
                      <Link className="edit-link" to={`/pages/${page.slug}`}>
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
