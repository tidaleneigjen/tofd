import { useEffect, useState } from "react";

function App() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setHealth)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <main className="page">
      <h1>Temple of the Feminine Divine</h1>
      <p>Website under construction.</p>

      <section className="health">
        <h2>API health check</h2>
        {error && <p role="alert">API unreachable: {error}</p>}
        {health && <pre>{JSON.stringify(health, null, 2)}</pre>}
        {!health && !error && <p>Checking…</p>}
      </section>
    </main>
  );
}

export default App;
