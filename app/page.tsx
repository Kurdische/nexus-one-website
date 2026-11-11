import { ArrowDown, ArrowRight, ArrowUpRight, Boxes, Layers3, Network, Orbit } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { BrandMark } from "@/components/brand";
import { AppIcon } from "@/components/catalog/app-icon";
import { pageMetadata, siteDescription } from "@/lib/metadata";
import { listApps } from "@/lib/server/content";
import { requireWebsitePage } from "@/lib/server/website-access";
import styles from "./home.module.css";

export const metadata = pageMetadata("NEXUS ONE – Your Digital Ecosystem", siteDescription, "/");

const featuredSlugs = ["jarvis", "lingoflow", "filemaster"];

export default async function HomePage() {
  await requireWebsitePage();
  const apps = listApps();
  const featured = [...apps].sort((first, second) => {
    const priority = (slug: string) => featuredSlugs.includes(slug) ? featuredSlugs.indexOf(slug) : featuredSlugs.length;
    return priority(first.slug) - priority(second.slug);
  }).slice(0, 3);

  return (
    <>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroArt} aria-hidden="true">
          <Image src="/nexus-orbit.webp" alt="" width={1536} height={1024} sizes="(max-width: 680px) 100vw, (max-width: 1400px) 84vw, 1200px" preload />
        </div>
        <div className={styles.heroGrid} aria-hidden="true" />
        <div className={`site-container ${styles.heroInner}`}>
          <div className={styles.heroCopy}>
            <div className={styles.heroKicker}><span className={styles.kickerDot} /> YOUR DIGITAL ECOSYSTEM</div>
            <h1 id="hero-title" className={styles.heroTitle}>NEXUS <span>ONE</span></h1>
            <p className={styles.heroTagline}>One ecosystem. Endless possibilities.</p>
            <p className={styles.heroDescription}>{siteDescription}</p>
            <div className={styles.heroActions}>
              <Link className="button button-primary" href="/apps">Apps entdecken <ArrowRight size={17} aria-hidden="true" /></Link>
              <Link className="button button-secondary" href="/ueber-uns">Über NEXUS ONE</Link>
            </div>
          </div>
          <div className={styles.artLabel} aria-hidden="true"><span /> NEXUS ORBIT <span className={styles.artDivider}>/</span> 01</div>
        </div>
      </section>

      <div className={`site-container ${styles.stripContainer}`}>
        <div className={styles.strip}>
          <div className={styles.stripItem}><Boxes size={20} aria-hidden="true" /><div><strong>{apps.length} Apps</strong><span>im Produktkatalog</span></div></div>
          <div className={styles.stripItem}><Layers3 size={20} aria-hidden="true" /><div><strong>KI, Produktivität &amp; mehr</strong><span>für deinen digitalen Alltag</span></div></div>
          <div className={styles.stripItem}><Orbit size={20} aria-hidden="true" /><div><strong>Ein Ökosystem</strong><span>von NEXUS ONE</span></div></div>
          <a className={styles.scrollLink} href="#ausgewaehlte-apps" aria-label="Zu den ausgewählten Apps"><ArrowDown size={19} aria-hidden="true" /></a>
        </div>
      </div>

      <section className={`site-container ${styles.featured}`} id="ausgewaehlte-apps" aria-labelledby="featured-title">
        <div className={styles.sectionHead}>
          <div>
            <p className={`eyebrow ${styles.sectionEyebrow}`}><span /> APP-KATALOG</p>
            <h2 id="featured-title">Ausgewählte <span>Apps.</span></h2>
            <p>Entdecke die Anwendungen hinter NEXUS ONE.</p>
          </div>
          <Link className={styles.textLink} href="/apps">Alle Apps ansehen <ArrowUpRight size={18} aria-hidden="true" /></Link>
        </div>
        {featured.length > 0 ? (
          <div className={styles.featuredGrid}>
            {featured.map((app, index) => (
              <Link href={`/apps/${app.slug}`} key={app.slug} className={styles.appCard} style={{ "--card-accent": app.accent } as CSSProperties}>
                <div className={styles.cardTop}>
                  <AppIcon app={app} />
                  <span className={styles.cardIndex}>0{index + 1}</span>
                </div>
                <div className={styles.cardCategory}>{app.category}</div>
                <h3>{app.name}</h3>
                <p>{app.description}</p>
                <span className={styles.cardLink}>Zur App <ArrowUpRight size={16} aria-hidden="true" /></span>
              </Link>
            ))}
          </div>
        ) : <p className={styles.empty}>Im Katalog sind derzeit keine Apps gelistet.</p>}
      </section>

      <section className={`site-container ${styles.ecosystem}`} aria-labelledby="ecosystem-title">
        <div className={styles.ecosystemPanel}>
          <div className={styles.ecosystemCopy}>
            <p className={`eyebrow ${styles.sectionEyebrow}`}><Network size={15} aria-hidden="true" /> DAS ÖKOSYSTEM</p>
            <h2 id="ecosystem-title">Viele Apps.<br /><span>Eine gemeinsame Idee.</span></h2>
            <p>Ob KI, Dateiverwaltung oder Fernzugriff – NEXUS ONE bündelt Anwendungen für unterschiedliche Aufgaben an einem Ort.</p>
            <Link className={styles.textLink} href="/oekosystem">Ökosystem entdecken <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
          <div className={styles.ecosystemArt} aria-hidden="true">
            <span /><span /><span />
            <BrandMark className={styles.ecosystemMark} />
          </div>
        </div>
      </section>
    </>
  );
}
