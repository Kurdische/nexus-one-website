import { ArrowRight, Compass, Layers3, Sparkles } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { SecondaryHero } from "@/components/secondary/page-sections";
import styles from "@/components/secondary/secondary.module.css";
import { pageMetadata } from "@/lib/metadata";
import { requireWebsitePage } from "@/lib/server/website-access";

export const metadata = pageMetadata("Über uns", "NEXUS ONE ist ein unabhängiges digitales Ökosystem mit dem Ziel, den digitalen Alltag einfacher und produktiver zu machen.", "/ueber-uns");

const values = [
  { icon: Compass, title: "Unabhängig entwickelt", description: "NEXUS ONE ist ein eigenständiges Projekt für selbst entwickelte Software." },
  { icon: Layers3, title: "Klarer Zweck", description: "Jede Anwendung hat ihren eigenen Schwerpunkt und bleibt als einzelnes Produkt erkennbar." },
  { icon: Sparkles, title: "Für den Alltag gedacht", description: "Unser Maßstab ist, ob eine Anwendung bei einer konkreten digitalen Aufgabe hilft." },
];

export default async function AboutPage() {
  await requireWebsitePage();
  return (
    <div className={`site-container ${styles.page}`}>
      <SecondaryHero
        label="Über uns"
        title="Hinter"
        accent="NEXUS ONE."
        description="One ecosystem. Endless possibilities."
        icon={<Compass size={34} strokeWidth={1.4} />}
      />

      <section className={styles.aboutStatement} aria-labelledby="mission-heading">
        <div className={styles.aboutMark} aria-hidden="true"><BrandMark /><span>NEXUS ONE</span></div>
        <div className={styles.aboutCopy}>
          <p className={styles.kicker}><span /> Unsere Mission</p>
          <h2 id="mission-heading">Software für den digitalen Alltag.</h2>
          <p>NEXUS ONE ist ein unabhängiges digitales Ökosystem, das verschiedene Anwendungen miteinander verbindet.</p>
          <p>Unser Ziel ist es, moderne Software zu entwickeln, die den digitalen Alltag einfacher, produktiver und besser macht.</p>
          <Link className={styles.textLink} href="/oekosystem">Das Ökosystem kennenlernen <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="values-heading">
        <p className={styles.kicker}><span /> Arbeitsweise</p>
        <h2 id="values-heading">Woran wir uns orientieren</h2>
        <div className={styles.cardGrid}>
          {values.map(({ icon: Icon, title: valueTitle, description: valueDescription }) => (
            <article className={styles.areaCard} key={valueTitle}>
              <div className={styles.smallMark} aria-hidden="true"><Icon size={20} /></div>
              <h3>{valueTitle}</h3>
              <p>{valueDescription}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
