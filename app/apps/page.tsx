import { Orbit } from "lucide-react";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { pageMetadata } from "@/lib/metadata";
import { listApps } from "@/lib/server/content";
import { requireWebsitePage } from "@/lib/server/website-access";
import styles from "./catalog.module.css";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata(
  "Apps",
  "Entdecke die Apps von NEXUS ONE. Finde Produktinformationen, Status und veröffentlichte Downloads an einem Ort.",
  "/apps",
);

export default async function AppsPage() {
  await requireWebsitePage();
  const apps = listApps();

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={`site-container ${styles.heroInner}`}>
          <div className={styles.heroCopy}>
            <div className="eyebrow"><span className={styles.signal} /> DER APP-KATALOG</div>
            <h1>Apps für deinen<br /><span>digitalen Alltag.</span></h1>
            <p>Von KI-Assistenz bis zur eigenen Infrastruktur. Entdecke die Anwendungen im NEXUS ONE Ökosystem und sieh, welche Downloads bereits verfügbar sind.</p>
          </div>
          <div className={styles.heroVisual} aria-hidden="true">
            <div className={styles.orbitOuter}>
              <div className={styles.orbitInner}>
                <Orbit size={46} strokeWidth={1} />
              </div>
            </div>
            <span className={styles.orbitLabel}>NEXUS ONE <span /> APP INDEX</span>
          </div>
        </div>
      </section>
      <div className="site-container">
        <CatalogFilters apps={apps} />
      </div>
    </div>
  );
}
