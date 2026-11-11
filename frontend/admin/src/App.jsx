import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";
import { isConfigured } from "./amplify";
import LoginForm from "./LoginForm";
import NewPasswordForm from "./NewPasswordForm";
import Editor from "./Editor";
import PagesList from "./PagesList";
import RoutedPageEditor from "./PageEditor";
import Shell from "./Shell";

function AdminApp({ onSignedOut }) {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell onSignedOut={onSignedOut} />}>
          <Route index element={<PagesList />} />
          <Route path="pages/home" element={<Editor />} />
          <Route path="pages/:slug" element={<RoutedPageEditor />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  const [view, setView] = useState("checking"); // checking | login | newPassword | editor
  const [newPasswordEmail, setNewPasswordEmail] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchAuthSession()
      .then((session) => {
        if (!cancelled) {
          setView(session.tokens?.idToken ? "editor" : "login");
        }
      })
      .catch(() => {
        if (!cancelled) setView("login");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isConfigured) {
    return (
      <main className="page">
        <div className="card">
          <h1>Admin</h1>
          <p className="alert error" role="alert">
            This app isn't configured yet. Set VITE_COGNITO_USER_POOL_ID,
            VITE_COGNITO_APP_CLIENT_ID, and VITE_API_BASE_URL (see
            .env.example) and rebuild.
          </p>
        </div>
      </main>
    );
  }

  if (view === "checking") {
    return (
      <main className="page">
        <p className="muted">Checking sign-in…</p>
      </main>
    );
  }

  if (view === "login") {
    return (
      <main className="page">
        <LoginForm
          onSignedIn={() => setView("editor")}
          onNewPasswordRequired={(email) => {
            setNewPasswordEmail(email);
            setView("newPassword");
          }}
        />
      </main>
    );
  }

  if (view === "newPassword") {
    return (
      <main className="page">
        <NewPasswordForm
          email={newPasswordEmail}
          onSignedIn={() => setView("editor")}
          onBack={() => setView("login")}
        />
      </main>
    );
  }

  return <AdminApp onSignedOut={() => setView("login")} />;
}
