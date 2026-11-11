"use client";

import type { CSSProperties } from "react";
import { useId, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { appStatusLabels, type AppStatus, type CatalogApp } from "@/lib/catalog";
import { AppIcon } from "./app-icon";
import styles from "../../app/apps/catalog.module.css";

const statusOptions = Object.entries(appStatusLabels) as [AppStatus, string][];

export function CatalogFilters({ apps }: { apps: CatalogApp[] }) {
  const queryId = useId();
  const statusId = useId();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const categories = [...new Set(apps.map((app) => app.category))].sort((a, b) => a.localeCompare(b, "de"));
  const search = query.trim().toLocaleLowerCase("de");
  const results = apps.filter((app) =>
    (!category || app.category === category) &&
    (!status || app.status === status) &&
    (!search || `${app.name} ${app.description} ${app.category}`.toLocaleLowerCase("de").includes(search)),
  );

  function clearFilters() {
    setQuery("");
    setCategory("");
    setStatus("");
  }

  return (
    <section className={styles.catalog} aria-labelledby="catalog-heading">
      <div className={styles.catalogHeading}>
        <h2 id="catalog-heading">Alle Anwendungen</h2>
        <span className={styles.count} role="status">{results.length} von {apps.length}</span>
      </div>
      <div className={styles.controls}>
        <div className={styles.search}>
          <label htmlFor={queryId}>Suche</label>
          <div className={styles.searchInput}>
            <Search size={17} aria-hidden="true" />
            <input type="search" id={queryId} placeholder="App suchen …" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        </div>
        <div className={styles.statusFilter}>
          <label htmlFor={statusId}>Produktstatus</label>
          <select id={statusId} value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Alle Status</option>
            {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div role="group" aria-label="App-Kategorie" className={styles.categoryList}>
          <button type="button" aria-pressed={category === ""} onClick={() => setCategory("")}>Alle Kategorien</button>
          {categories.map((value) => (
            <button key={value} type="button" aria-pressed={category === value} onClick={() => setCategory(value)}>
              {value}
            </button>
          ))}
        </div>
      </div>

      {results.length ? (
        <ul className={styles.appGrid}>
          {results.map((app) => (
            <li key={app.slug}>
              <Link className={styles.card} href={`/apps/${app.slug}`} style={{ "--app-accent": app.accent } as CSSProperties}>
                <div className={styles.cardTop}>
                  <AppIcon app={app} size={54} />
                  <span className={styles.cardArrow}><ArrowUpRight size={19} aria-hidden="true" /></span>
                </div>
                <div className={styles.cardBody}>
                  <span className={styles.category}>{app.category}</span>
                  <h3>{app.name}</h3>
                  <p>{app.description}</p>
                </div>
                <div className={styles.cardFoot}>
                  <span className={styles.status} data-status={app.status}><span />{appStatusLabels[app.status]}</span>
                  <span>Produkt ansehen</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.empty}>
          <Search size={24} aria-hidden="true" />
          <h3>{apps.length ? "Keine Apps gefunden" : "Noch keine Apps im Katalog"}</h3>
          <p>{apps.length ? "Ändere den Suchbegriff oder passe die Filter an." : "Hier erscheinen die Produkte des NEXUS ONE Ökosystems."}</p>
          {apps.length > 0 && <button className="button button-secondary" type="button" onClick={clearFilters}>Filter zurücksetzen</button>}
        </div>
      )}
    </section>
  );
}
