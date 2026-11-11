import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { FOOTER, NAV_ITEMS, SITE_NAME } from "../site";

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  // The mobile menu closes on Escape; it also closes on navigation via each
  // link's onClick.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const year = new Date().getFullYear();

  return (
    <div className="site">
      <header className="site-header">
        <div className="header-top">
          <Link
            to="/"
            className="logo-link"
            aria-label={`${SITE_NAME} — home`}
            onClick={closeMenu}
          >
            <img className="logo" src="/images/tofd-logo.jpg" alt="" />
          </Link>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="site-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            Menu
          </button>
          <nav
            id="site-nav"
            className={`site-nav${menuOpen ? " site-nav--open" : ""}`}
            aria-label="Main"
          >
            <ul className="nav-list">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      `nav-link${isActive ? " nav-link--active" : ""}`
                    }
                    onClick={closeMenu}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="header-band">
          <h1>{SITE_NAME}</h1>
        </div>
      </header>

      <main className="page">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="footer-contact">
          <p className="footer-name">{SITE_NAME}</p>
          <p>{FOOTER.address}</p>
          <p>
            <a href={`mailto:${FOOTER.email}`}>{FOOTER.email}</a>
          </p>
        </div>
        <p className="footer-copy">
          © {year} {SITE_NAME} 501c3
        </p>
      </footer>
    </div>
  );
}
