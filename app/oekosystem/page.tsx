import { ArrowRight, ArrowUpRight, Boxes, GitFork, Network } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { AppIcon } from "@/components/catalog/app-icon";
import { SecondaryHero } from "@/components/secondary/page-sections";
import styles from "@/components/secondary/secondary.module.css";
import { pageMetadata } from "@/lib/metadata";
import { listApps } from "@/lib/server/content";
import { requireWebsitePage } from "@/lib/server/website-access";

export const metadata = pageMetadata("Ökosystem", "Lerne die Anwendungen von NEXUS ONE und die Idee hinter dem digitalen Ökosystem kennen.", "/oekosystem");
export const dynamic = "force-dynamic";

export default async function EcosystemPage() {
  await requireWebsitePage();
  const apps = listApps();
  const categories = [...new Set(apps.map((app) => app.category))];
  const spotlight = apps.slice(0, 6);

  return (
    <div className={`site-container ${styles.page}`}>
      <SecondaryHero
        label="Das Ökosystem"
        title="Eigenständige Apps."
        accent="Eine gemeinsame Idee."
        description="NEXUS ONE versammelt unabhängige Anwendungen unter einem Dach. Jede App widmet sich einer eigenen Aufgabe und bringt ihre eigene Identität mit."
        icon={<Network size={32} strokeWidth={1.4} />}
      />

      <section className={styles.networkPanel} aria-labelledby="network-heading">
        <div className={styles.networkCopy}>
          <p className={styles.kicker}><span /> Plattform</p>
          <h2 id="network-heading">Dein Einstieg in NEXUS ONE</h2>
          <p>Vom persönlichen KI-Assistenten bis zur Verwaltung eigener Geräte und Server. Entdecke, welche Anwendungen zu deinem digitalen Alltag passen.</p>
          <Link className={styles.textLink} href="/apps">Alle Apps entdecken <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
        <div className={styles.networkGraph} role="group" aria-label="Ausgewählte Anwendungen im Ökosystem">
          <svg className={styles.graphLines} viewBox="0 0 480 324" fill="none" preserveAspectRatio="none" aria-hidden="true">
            <ellipse cx="240" cy="162" rx="156" ry="119" />
            <ellipse cx="240" cy="162" rx="110" ry="78" />
            <path d="M240 162L103 69M240 162L381 69M240 162L74 162M240 162L407 162M240 162L103 255M240 162L381 255" />
          </svg>
          <span className={styles.graphCore} aria-hidden="true"><BrandMark /><b>NEXUS ONE</b></span>
          {spotlight.map((app, index) => (
            <Link
              className={styles.graphApp}
              data-position={index}
              href={`/apps/${app.slug}`}
              key={app.slug}
            >
              <AppIcon app={app} size={26} />
              <span>{app.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="areas-heading">
        <p className={styles.kicker}><span /> Anwendungen</p>
        <h2 id="areas-heading">Bereiche im Ökosystem</h2>
        {categories.length === 0 ? <p className={styles.muted}>Sobald Anwendungen gelistet sind, erscheinen ihre Bereiche hier.</p> : (
          <div className={styles.cardGrid}>
            {categories.map((category, index) => (
              <article className={styles.areaCard} key={category}>
                <div className={styles.areaCardTop}>
                  <div className={styles.smallMark} aria-hidden="true">{index % 2 ? <GitFork size={20} /> : <Boxes size={20} />}</div>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </div>
                <h3>{category}</h3>
                <ul className={styles.areaList}>
                  {apps.filter((app) => app.category === category).map((app) => (
                    <li key={app.slug}><Link href={`/apps/${app.slug}`}>{app.name}<ArrowUpRight size={15} aria-hidden="true" /></Link></li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
