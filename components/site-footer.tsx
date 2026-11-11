import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Brand } from "./brand";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-container">
        <div className="footer-main">
          <div>
            <Brand />
            <p>Your Digital Ecosystem.</p>
          </div>
          <nav aria-label="Plattform" className="footer-links">
            <span>PLATTFORM</span>
            <Link href="/apps">Apps entdecken</Link>
            <Link href="/oekosystem">Ökosystem</Link>
            <Link href="/downloads">Downloads</Link>
          </nav>
          <nav aria-label="NEXUS ONE" className="footer-links">
            <span>NEXUS ONE</span>
            <Link href="/ueber-uns">Über uns</Link>
            <Link href="/updates">Updates</Link>
            <Link href="/kontakt">Kontakt <ArrowUpRight size={13} aria-hidden="true" /></Link>
          </nav>
        </div>
        <div className="footer-end"><span>© {new Date().getFullYear()} NEXUS ONE</span><span>One ecosystem. Endless possibilities.</span></div>
      </div>
    </footer>
  );
}
