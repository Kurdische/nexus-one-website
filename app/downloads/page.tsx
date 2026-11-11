import { ArrowDownToLine, ChevronDown, Package } from "lucide-react";
import Link from "next/link";
import { EmptyState, FilterLinks, SecondaryHero, formatDate } from "@/components/secondary/page-sections";
import styles from "@/components/secondary/secondary.module.css";
import { pageMetadata } from "@/lib/metadata";
import { downloadPlatforms, listApps, listDownloads } from "@/lib/server/content";
import { requireWebsitePage } from "@/lib/server/website-access";

export const metadata = pageMetadata("Downloads", "Veröffentlichte NEXUS ONE Downloads mit Plattform, Version, Dateigröße und Änderungsprotokoll.", "/downloads");
export const dynamic = "force-dynamic";

const platformFilters = downloadPlatforms.map((platform) => ({ value: platform, label: platform }));
const byteUnits = ["B", "KiB", "MiB", "GiB"];
const sizeFormat = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });

function formatSize(size: number) {
  let scaled = size;
  let unit = 0;
  while (scaled >= 1024 && unit < byteUnits.length - 1) {
    scaled /= 1024;
    unit++;
  }
  return `${sizeFormat.format(scaled)} ${byteUnits[unit]}`;
}

export default async function DownloadsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string | string[] }>;
}) {
  await requireWebsitePage();
  const { filter } = await searchParams;
  const selected = downloadPlatforms.find((platform) => platform === filter) ?? "";
  const appNames = new Map(listApps().map((app) => [app.slug, app.name]));
  const releases = listDownloads();
  const visible = releases.filter((release) => !selected || release.platform === selected);

  return (
    <div className={`site-container ${styles.page}`}>
      <SecondaryHero
        label="Download-Center"
        title="NEXUS ONE"
        accent="zum Download."
        description="Hier findest du die veröffentlichten Dateien unserer Apps mit Plattform, Versionsnummer, Dateigröße und Änderungsprotokoll."
        icon={<ArrowDownToLine size={32} strokeWidth={1.5} />}
      />

      {releases.length > 0 && <FilterLinks path="/downloads" label="Downloads nach Plattform filtern" filters={platformFilters} selected={selected} />}
      {visible.length === 0 ? (
        <EmptyState
          icon={<Package size={23} />}
          title={selected ? `Keine Downloads für ${selected}` : "Noch keine Downloads verfügbar"}
          link={selected ? { href: "/downloads", label: "Alle Downloads anzeigen" } : { href: "/apps", label: "Apps entdecken" }}
        >
          {selected ? "In der Gesamtübersicht findest du Veröffentlichungen für weitere Plattformen." : "Die Übersicht füllt sich, sobald Installations- oder Archivdateien für die Apps veröffentlicht wurden."}
        </EmptyState>
      ) : (
        <div className={styles.releaseGrid}>
          {visible.map((release) => {
            const appName = appNames.get(release.appSlug) ?? release.appSlug;

            return (
              <article className={styles.release} key={release.id}>
                <div className={styles.releaseHeading}>
                  <div>
                    <p className={styles.tag}>{release.platform}</p>
                    <h2><Link href={`/apps/${release.appSlug}`}>{appName}</Link></h2>
                    <p className={styles.releaseFilename}>{release.fileName}</p>
                  </div>
                  <a className={styles.downloadLink} href={release.href} download={release.fileName} aria-label={`${appName}, Version ${release.version} für ${release.platform} herunterladen`}>
                    <ArrowDownToLine size={17} aria-hidden="true" /> <span>Download</span>
                  </a>
                </div>
                <dl className={styles.releaseMeta}>
                  <div><dt>Version</dt><dd>{release.version}</dd></div>
                  <div><dt>Dateigröße</dt><dd>{formatSize(release.size)}</dd></div>
                  <div><dt>Veröffentlicht</dt><dd><time dateTime={release.releasedAt}>{formatDate(release.releasedAt)}</time></dd></div>
                </dl>
                <details className={styles.releaseNotes}>
                  <summary>Änderungsprotokoll <ChevronDown size={17} aria-hidden="true" /></summary>
                  <p className={styles.preLine}>{release.changelog}</p>
                </details>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
