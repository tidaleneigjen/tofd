import { signOut } from "aws-amplify/auth";
import { Link, Outlet } from "react-router-dom";

// Shared chrome for the authenticated admin: a slim top bar with a link
// back to the pages list and a sign-out button.
export default function Shell({ onSignedOut }) {
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
        <p className="topbar-brand">TOFD Admin</p>
        <div className="topbar-actions">
          <Link className="topbar-link" to="/">
            Pages
          </Link>
          <button type="button" className="link" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
