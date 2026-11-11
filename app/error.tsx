"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="site-container notice-page">
      <span className="eyebrow">Websitefehler</span>
      <h1>Die Seite konnte nicht geladen werden.</h1>
      <p>Du kannst die Seite erneut laden.</p>
      <button type="button" className="button button-primary" onClick={reset}>Erneut versuchen</button>
    </div>
  );
}
