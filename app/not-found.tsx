import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="site-container notice-page">
      <span className="eyebrow">404</span>
      <h1>Diese Seite ist nicht verfügbar.</h1>
      <p>Im App-Katalog findest du alle aktuell gelisteten Produkte von NEXUS ONE.</p>
      <Link className="button button-primary" href="/apps">Zum App-Katalog <ArrowRight size={18} aria-hidden="true" /></Link>
    </div>
  );
}
