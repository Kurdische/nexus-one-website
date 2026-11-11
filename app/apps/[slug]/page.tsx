import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowDownToLine, ArrowLeft, ChevronDown, Image as ImageIcon, Layers3 } from "lucide-react";
import { AppIcon } from "@/components/catalog/app-icon";
import { ProductArtwork } from "@/components/catalog/product-artwork";
import { appStatusLabels } from "@/lib/catalog";
import { pageMetadata } from "@/lib/metadata";
import { getApp, listDownloads, listScreenshots } from "@/lib/server/content";
import { requireWebsitePage } from "@/lib/server/website-access";
import catalogStyles from "../catalog.module.css";
import styles from "./product.module.css";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await requireWebsitePage();
  const { slug } = await params;
  const app = getApp(slug);
  if (!app) return { title: "App nicht gefunden", robots: { index: false } };
  return pageMetadata(app.name, app.description, `/apps/${app.slug}`);
}

const formatDate = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeZone: "UTC" });
const formatNumber = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${formatNumber.format(bytes / (1024 * 1024))} MiB`;
  if (bytes >= 1024) return `${formatNumber.format(bytes / 1024)} KiB`;
  return `${formatNumber.format(bytes)} B`;
}

export default async function ProductPage({ params }: Props) {
  await requireWebsitePage();
  const { slug } = await params;
  const app = getApp(slug);
  if (!app) notFound();

  const downloads = listDownloads(app.slug);
  const screenshots = listScreenshots(app.slug);
  const platforms = [...new Set(downloads.map((download) => download.platform))];
  const latest = downloads[0];
  const productDetails = [
    { title: "Hauptfunktionen", items: app.features ?? [], empty: "Konkrete Funktionen wurden noch nicht veröffentlicht." },
    { title: "Vorteile", items: app.benefits ?? [], empty: "Konkrete Vorteile wurden noch nicht veröffentlicht." },
  ];
  const hasProductDetails = productDetails.some(({ items }) => items.length > 0);

  return (
    <div className={styles.product} style={{ "--app-accent": app.accent } as CSSProperties}>
      <section className={styles.hero}>
        <div className={`site-container ${styles.heroInner}`}>
          <Link className={styles.back} href="/apps"><ArrowLeft size={16} aria-hidden="true" /> Alle Apps</Link>
          <div className={styles.heroContent}>
            <div className={styles.heroCopy}>
              <div className={styles.kicker}>
                <AppIcon app={app} size={55} />
                <div>
                  <span className={styles.category}>{app.category}</span>
                  <span className={catalogStyles.status} data-status={app.status}><span />{appStatusLabels[app.status]}</span>
                </div>
              </div>
              <h1>{app.name}</h1>
              <p className={styles.tagline}>{app.tagline}</p>
              <p className={styles.overview}>{app.overview}</p>
              <a className="button button-secondary" href="#downloads">
                <ArrowDown size={16} aria-hidden="true" /> Downloads &amp; Versionen
              </a>
            </div>
            <ProductArtwork app={app} />
          </div>
        </div>
      </section>

      <div className={`site-container ${styles.detailLayout}`}>
        <aside className={styles.sidebar}>
          <nav aria-label="Auf dieser Produktseite">
            <p className="eyebrow">AUF DIESER SEITE</p>
            <a href="#funktionen">Funktionen</a>
            <a href="#vorschau">Screenshots</a>
            <a href="#downloads">Downloads &amp; Versionen</a>
            <a href="#faq">Häufige Fragen</a>
          </nav>
        </aside>
        <div className={styles.sections}>
          <section className={styles.section} id="funktionen" aria-labelledby="features-heading">
            <div className={styles.sectionMark}><Layers3 size={16} aria-hidden="true" /> PRODUKTÜBERSICHT</div>
            <h2 id="features-heading">Hauptfunktionen &amp; Vorteile</h2>
            {hasProductDetails ? (
              <div className={styles.productDetails}>
                {productDetails.map(({ title, items, empty }) => (
                  <div key={title}>
                    <h3>{title}</h3>
                    {items.length > 0 ? (
                      <ul>{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
                    ) : <p>{empty}</p>}
                  </div>
                ))}
              </div>
            ) : <p>Für {app.name} sind noch keine konkreten Funktionen oder Vorteile veröffentlicht.</p>}
            {app.focus.length > 0 && (
              <div className={styles.focus}>
                <h3>Anwendungsbereich</h3>
                <ul className={styles.focusList}>
                  {app.focus.map((area, index) => (
                    <li key={`${area}-${index}`}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{area}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className={styles.section} id="vorschau" aria-labelledby="screenshots-heading">
            <div className={styles.sectionMark}><ImageIcon size={16} aria-hidden="true" /> PRODUKTEINBLICKE</div>
            <h2 id="screenshots-heading">Screenshots</h2>
            {screenshots.length > 0 ? (
              <ul className={styles.gallery}>
                {screenshots.map((screenshot) => (
                  <li key={screenshot.id}>
                    <a href={screenshot.href} className={styles.galleryLink}>
                      <Image fill src={screenshot.href} alt={screenshot.alt} sizes="(max-width: 700px) 100vw, 50vw" unoptimized />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.empty}>
                <ImageIcon size={19} aria-hidden="true" />
                <p>Offizielle Screenshots wurden noch nicht veröffentlicht. Die Grafik oben zeigt die visuelle Identität der App.</p>
              </div>
            )}
          </section>

          <section className={styles.section} id="downloads" aria-labelledby="downloads-heading">
            <div className={styles.sectionMark}><ArrowDownToLine size={16} aria-hidden="true" /> VERÖFFENTLICHUNGEN</div>
            <h2 id="downloads-heading">Downloads &amp; Versionen</h2>
            <dl className={styles.releaseSummary}>
              <div><dt>Letzte Veröffentlichung</dt><dd>{latest?.version ?? "Noch keine Version veröffentlicht"}</dd></div>
              <div><dt>Unterstützte Plattformen</dt><dd>{platforms.length ? platforms.join(", ") : "Noch nicht angegeben"}</dd></div>
            </dl>
            {downloads.length ? (
              <div className={styles.releaseList}>
                {downloads.map((download) => (
                  <article key={download.id} className={styles.release}>
                    <div className={styles.releaseHeader}>
                      <div>
                        <h3>{download.platform} · {download.version}</h3>
                        <p><time dateTime={download.releasedAt}>{formatDate.format(new Date(download.releasedAt))}</time> · {formatSize(download.size)}</p>
                      </div>
                      <a className="button button-secondary" href={download.href} aria-label={`${app.name} ${download.version} für ${download.platform} herunterladen`}>
                        <ArrowDownToLine size={16} aria-hidden="true" /> Download
                      </a>
                    </div>
                    <details className={styles.details}>
                      <summary>Änderungsprotokoll <ChevronDown size={16} aria-hidden="true" /></summary>
                      <p>{download.changelog}</p>
                    </details>
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.empty}>
                <ArrowDownToLine size={19} aria-hidden="true" />
                <p>Für diese App gibt es derzeit keine Downloads oder Änderungsprotokolle.</p>
              </div>
            )}
            <Link className={styles.textLink} href="/downloads">Zur Download-Übersicht <span aria-hidden="true">↗</span></Link>
          </section>

          <section className={styles.section} id="faq" aria-labelledby="faq-heading">
            <div className={styles.sectionMark}>GUT ZU WISSEN</div>
            <h2 id="faq-heading">Häufig gestellte Fragen</h2>
            <details className={styles.details}>
              <summary>Wofür ist {app.name} gedacht? <ChevronDown size={17} aria-hidden="true" /></summary>
              <p>{app.overview}</p>
            </details>
            <details className={styles.details}>
              <summary>Auf welchen Plattformen ist die App verfügbar? <ChevronDown size={17} aria-hidden="true" /></summary>
              <p>{platforms.length ? `Veröffentlichte Downloads gibt es für ${platforms.join(", ")}.` : "Es sind noch keine unterstützten Plattformen angegeben. Veröffentlichte Versionen und ihre Plattformen erscheinen im Downloadbereich."}</p>
            </details>
            <details className={styles.details}>
              <summary>Wo finde ich Neuigkeiten zu dieser App? <ChevronDown size={17} aria-hidden="true" /></summary>
              <p>Veröffentlichte Ankündigungen und Neuigkeiten findest du unter <Link href="/updates">Updates</Link>.</p>
            </details>
          </section>
        </div>
      </div>
    </div>
  );
}
