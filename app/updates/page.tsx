import { Activity, Bell, ChevronRight, Newspaper } from "lucide-react";
import Link from "next/link";
import { EmptyState, FilterLinks, SecondaryHero, formatDate } from "@/components/secondary/page-sections";
import styles from "@/components/secondary/secondary.module.css";
import { pageMetadata } from "@/lib/metadata";
import { listApps, listUpdates } from "@/lib/server/content";
import { requireWebsitePage } from "@/lib/server/website-access";

export const metadata = pageMetadata("Updates", "Offizielle Ankündigungen, App-Updates und Änderungsprotokolle für NEXUS ONE.", "/updates");
export const dynamic = "force-dynamic";

const categories = [
  { value: "announcement", label: "Ankündigung" },
  { value: "app", label: "Neue App" },
  { value: "feature", label: "Neue Funktion" },
  { value: "update", label: "App-Update" },
  { value: "fix", label: "Fehlerbehebung" },
] as const;

export default async function UpdatesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string | string[] }>;
}) {
  await requireWebsitePage();
  const { filter } = await searchParams;
  const selected = categories.find(({ value }) => value === filter)?.value ?? "";
  const entries = listUpdates();
  const visible = entries.filter((entry) => !selected || entry.category === selected);
  const appNames = new Map(listApps().map((app) => [app.slug, app.name]));

  return (
    <div className={`site-container ${styles.page}`}>
      <SecondaryHero
        label="Newsroom"
        title="Updates."
        accent="Neuigkeiten."
        description="Offizielle Meldungen zu neuen Apps, Funktionen, veröffentlichten Versionen und behobenen Fehlern."
        icon={<Activity size={34} strokeWidth={1.45} />}
      />

      {entries.length > 0 && <FilterLinks path="/updates" label="Updates nach Kategorie filtern" filters={categories} selected={selected} />}
      {visible.length === 0 ? (
        <EmptyState
          icon={selected ? <Newspaper size={23} /> : <Bell size={23} />}
          title={selected ? "Keine Meldungen in dieser Kategorie" : "Noch keine Meldungen veröffentlicht"}
          link={selected ? { href: "/updates", label: "Alle Meldungen anzeigen" } : { href: "/apps", label: "App-Katalog ansehen" }}
        >
          {selected ? "Wähle eine andere Kategorie, um weitere Meldungen zu sehen." : "Sobald es offizielle Neuigkeiten von NEXUS ONE gibt, erscheinen sie hier."}
        </EmptyState>
      ) : (
        <div className={styles.timeline}>
          {visible.map((entry) => {
            const relatedApp = entry.appSlug && appNames.get(entry.appSlug);

            return (
              <article className={styles.update} key={entry.id}>
                <div className={styles.updateMeta}>
                  <time dateTime={entry.publishedAt}>{formatDate(entry.publishedAt)}</time>
                  <span className={styles.tag}>{categories.find(({ value }) => value === entry.category)?.label}</span>
                </div>
                <h2>{entry.title}</h2>
                <p className={styles.preLine}>{entry.body}</p>
                {relatedApp && <Link className={styles.textLink} href={`/apps/${entry.appSlug}`}>
                  {relatedApp}<ChevronRight size={16} aria-hidden="true" />
                </Link>}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
