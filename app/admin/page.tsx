import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { appStatusLabels } from "@/lib/catalog";
import { adminViews, isAdminView, type AdminView } from "@/lib/server/admin-content";
import { adminCookie, getAdminSession, isAdminConfigured } from "@/lib/server/auth";
import {
  downloadPlatforms, listApps, listDownloads, listScreenshots, listUpdates, updateCategories,
  type AppRecord, type DownloadRecord, type UpdateRecord,
} from "@/lib/server/content";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Administration",
  description: "Geschützter Verwaltungsbereich von NEXUS ONE.",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const viewLabels: Record<AdminView, string> = {
  apps: "Apps",
  downloads: "Downloads",
  screenshots: "Screenshots",
  updates: "Updates",
};

const updateLabels = {
  app: "Neue App",
  feature: "Neue Funktion",
  update: "App-Update",
  fix: "Fehlerbehebung",
  announcement: "Ankündigung",
};

const notices = {
  saved: "Die Änderungen wurden gespeichert.",
  removed: "Der Eintrag wurde gelöscht.",
  invalid: "Prüfe die Eingaben sowie Dateityp und -inhalt.",
  unavailable: "Der Eintrag existiert bereits oder ist nicht mehr verfügbar.",
  "too-large": "Die hochgeladene Datei überschreitet das zulässige Größenlimit.",
  "login-invalid": "E-Mail-Adresse oder Passwort stimmt nicht.",
  expired: "Deine Sitzung ist abgelaufen. Melde dich erneut an.",
  "logged-out": "Du bist abgemeldet.",
};

function HiddenFields({ csrf, operation, id }: { csrf: string; operation: string; id?: string }) {
  return <>
    <input type="hidden" name="csrf" value={csrf} />
    <input type="hidden" name="operation" value={operation} />
    {id && <input type="hidden" name="id" value={id} />}
  </>;
}

function RemoveForm({ csrf, view, id, appSlug }: { csrf: string; view: AdminView; id?: string; appSlug?: string }) {
  return <details className={styles.remove}>
    <summary>Eintrag löschen</summary>
    <form method="post" action={`/api/admin/${view}`} className={styles.form}>
      <HiddenFields csrf={csrf} operation="remove" id={id} />
      {appSlug && <input type="hidden" name="slug" value={appSlug} />}
      <p>{appSlug ? "Diese App und ihre Downloads und Screenshots werden dauerhaft gelöscht." : "Dieser Eintrag wird dauerhaft gelöscht."}</p>
      <button className={styles.danger} type="submit">Dauerhaft löschen</button>
    </form>
  </details>;
}

function AppForm({ csrf, app }: { csrf: string; app?: AppRecord }) {
  return <form className={styles.form} method="post" action="/api/admin/apps">
    <HiddenFields csrf={csrf} operation={app ? "edit" : "create"} />
    {app && <input type="hidden" name="slug" value={app.slug} />}
    <div className={styles.fields}>
      {!app && <label>URL-Kennung
        <input name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" title="Kleinbuchstaben, Zahlen und Bindestriche"
          maxLength={48} placeholder="meine-app" required />
      </label>}
      <label>Name<input name="name" defaultValue={app?.name} minLength={2} maxLength={80} required /></label>
      <label>Kategorie<input name="category" defaultValue={app?.category} minLength={2} maxLength={80} required /></label>
      <label>Status
        <select name="status" defaultValue={app?.status || "listed"}>
          {Object.entries(appStatusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </label>
      <label>Akzentfarbe<input type="color" name="accent" defaultValue={app?.accent || "#a897ff"} /></label>
      <label>Symbolkennung
        <input name="icon" list="admin-app-icons" defaultValue={app?.icon || "app-window"} maxLength={40}
          title="Buchstaben, Zahlen und Bindestriche" pattern="[A-Za-z][A-Za-z0-9\-]*" required />
      </label>
      <label className={styles.wide}>Kurzbeschreibung
        <input name="description" defaultValue={app?.description} minLength={5} maxLength={240} required />
      </label>
      <label className={styles.wide}>Leitsatz
        <input name="tagline" defaultValue={app?.tagline} minLength={5} maxLength={240} />
      </label>
      <label className={styles.wide}>Produktbeschreibung
        <textarea name="overview" rows={4} defaultValue={app?.overview} maxLength={2000} />
      </label>
      <label className={styles.wide}>Schwerpunkte, je eine Zeile
        <textarea name="focus" rows={4} defaultValue={app?.focus.join("\n")} maxLength={2171} />
      </label>
      <label>Bestätigte Hauptfunktionen, je eine Zeile
        <textarea name="features" rows={4} defaultValue={app?.features?.join("\n")} maxLength={2171} />
      </label>
      <label>Bestätigte Vorteile, je eine Zeile
        <textarea name="benefits" rows={4} defaultValue={app?.benefits?.join("\n")} maxLength={2171} />
      </label>
    </div>
    <button className="button button-primary" type="submit">{app ? "App speichern" : "App hinzufügen"}</button>
  </form>;
}

function AppSelect({ apps, value, required = true }: { apps: AppRecord[]; value?: string | null; required?: boolean }) {
  return <label>App
    <select name="appSlug" defaultValue={value ?? ""} required={required}>
      <option value="" disabled={required}>{required ? "App auswählen" : "Keine Zuordnung"}</option>
      {apps.map((app) => <option key={app.slug} value={app.slug}>{app.name}</option>)}
    </select>
  </label>;
}

function DownloadForm({ csrf, apps, release }: { csrf: string; apps: AppRecord[]; release?: DownloadRecord }) {
  return <form className={styles.form} method="post" action="/api/admin/downloads"
    encType={release ? undefined : "multipart/form-data"}>
    <HiddenFields csrf={csrf} operation={release ? "edit" : "create"} id={release?.id} />
    <div className={styles.fields}>
      {!release && <>
        <AppSelect apps={apps} />
        <label>Plattform
          <select name="platform" required>
            {downloadPlatforms.map((platform) => <option key={platform}>{platform}</option>)}
          </select>
        </label>
      </>}
      <label>Version
        <input name="version" placeholder="Versionsnummer" maxLength={40} defaultValue={release?.version} required />
      </label>
      <label>Veröffentlichungsdatum
        <input type="date" name="releasedAt" defaultValue={release?.releasedAt} required />
      </label>
      {!release && <label className={styles.wide}>Paketdatei
        <input name="file" type="file" accept=".zip,.exe,.msi,.apk,.ipa" required />
        <small>Bis 64 MiB. Windows: EXE, MSI oder ZIP. Android: APK. iOS: IPA. Web: ZIP.</small>
      </label>}
      <label className={styles.wide}>Änderungsprotokoll
        <textarea name="changelog" rows={4} minLength={3} maxLength={4000} defaultValue={release?.changelog} required />
      </label>
    </div>
    <button className="button button-primary" type="submit">{release ? "Version speichern" : "Download veröffentlichen"}</button>
  </form>;
}

function UpdateForm({ csrf, apps, update }: { csrf: string; apps: AppRecord[]; update?: UpdateRecord }) {
  return <form className={styles.form} method="post" action="/api/admin/updates">
    <HiddenFields csrf={csrf} operation={update ? "edit" : "create"} id={update?.id} />
    <div className={styles.fields}>
      <label className={styles.wide}>Titel
        <input name="title" defaultValue={update?.title} minLength={3} maxLength={140} required />
      </label>
      <label>Kategorie
        <select name="category" defaultValue={update?.category ?? "announcement"} required>
          {updateCategories.map((category) => <option key={category} value={category}>{updateLabels[category]}</option>)}
        </select>
      </label>
      <label>Veröffentlichungsdatum
        <input type="date" name="publishedAt" defaultValue={update?.publishedAt} required />
      </label>
      <AppSelect apps={apps} value={update?.appSlug} required={false} />
      <label className={styles.wide}>Beitrag
        <textarea name="body" rows={6} defaultValue={update?.body} minLength={5} maxLength={8000} required />
      </label>
    </div>
    <button className="button button-primary" type="submit">{update ? "Beitrag speichern" : "Beitrag veröffentlichen"}</button>
  </form>;
}

function Dashboard({ view, csrf }: { view: AdminView; csrf: string }) {
  const apps = listApps();
  const appName = (slug: string) => apps.find((app) => app.slug === slug)?.name ?? slug;

  if (view === "apps") return <div className={styles.stack}>
    <datalist id="admin-app-icons">
      {["app-window", "sparkles", "languages", "folder", "music", "monitor", "devices", "server", "network", "support", "workflow"]
        .map((icon) => <option key={icon} value={icon} />)}
    </datalist>
    <details className={styles.panel}>
      <summary>Neue App hinzufügen</summary>
      <AppForm csrf={csrf} />
    </details>
    {apps.map((app) => <details className={styles.panel} key={app.slug}>
      <summary>{app.name} <small>{appStatusLabels[app.status]}</small></summary>
      <AppForm csrf={csrf} app={app} />
      <RemoveForm csrf={csrf} view={view} appSlug={app.slug} />
    </details>)}
  </div>;

  if (view === "downloads") {
    const releases = listDownloads();
    return <div className={styles.stack}>
      {apps.length > 0 && <details className={styles.panel}>
        <summary>Download veröffentlichen</summary>
        <DownloadForm csrf={csrf} apps={apps} />
      </details>}
      {releases.length === 0 && <p className={styles.empty}>Es sind noch keine Downloads veröffentlicht.</p>}
      {releases.map((release) => <details className={styles.panel} key={release.id}>
        <summary>{appName(release.appSlug)} · {release.platform} <small>{release.version}</small></summary>
        <a className={styles.fileLink} href={release.href}>{release.fileName} herunterladen</a>
        <DownloadForm csrf={csrf} apps={apps} release={release} />
        <RemoveForm csrf={csrf} view={view} id={release.id} />
      </details>)}
    </div>;
  }

  if (view === "screenshots") {
    const screenshots = listScreenshots();
    return <div className={styles.stack}>
      {apps.length > 0 && <details className={styles.panel}>
        <summary>Screenshot hochladen</summary>
        <form className={styles.form} method="post" action="/api/admin/screenshots" encType="multipart/form-data">
          <HiddenFields csrf={csrf} operation="create" />
          <div className={styles.fields}>
            <AppSelect apps={apps} />
            <label>Alternativtext<input name="alt" minLength={3} maxLength={200} required /></label>
            <label className={styles.wide}>Bilddatei
              <input name="file" type="file" accept="image/png,image/jpeg,image/webp" required />
              <small>PNG, JPEG oder WebP bis 5 MiB.</small>
            </label>
          </div>
          <button className="button button-primary" type="submit">Screenshot veröffentlichen</button>
        </form>
      </details>}
      {screenshots.length === 0 && <p className={styles.empty}>Es sind noch keine Screenshots veröffentlicht.</p>}
      {screenshots.map((image) => <details className={styles.panel} key={image.id}>
        <summary>{appName(image.appSlug)} <small>{image.alt}</small></summary>
        <a className={styles.fileLink} href={image.href}>Screenshot ansehen</a>
        <RemoveForm csrf={csrf} view={view} id={image.id} />
      </details>)}
    </div>;
  }

  const updates = listUpdates();
  return <div className={styles.stack}>
    <details className={styles.panel}>
      <summary>Beitrag veröffentlichen</summary>
      <UpdateForm csrf={csrf} apps={apps} />
    </details>
    {updates.length === 0 && <p className={styles.empty}>Es sind noch keine Beiträge veröffentlicht.</p>}
    {updates.map((update) => <details className={styles.panel} key={update.id}>
      <summary>{update.title} <small>{updateLabels[update.category]}</small></summary>
      <UpdateForm csrf={csrf} apps={apps} update={update} />
      <RemoveForm csrf={csrf} view={view} id={update.id} />
    </details>)}
  </div>;
}

type AdminPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const [query, cookieStore] = await Promise.all([searchParams, cookies()]);
  const view = typeof query.view === "string" && isAdminView(query.view) ? query.view : "apps";
  const notice = typeof query.notice === "string" && Object.hasOwn(notices, query.notice)
    ? notices[query.notice as keyof typeof notices]
    : null;
  const configured = isAdminConfigured();
  const session = getAdminSession(cookieStore.get(adminCookie().name)?.value);

  return <section className={`site-container ${styles.shell}`} aria-labelledby="admin-title">
    <div className={styles.heading}>
      <div>
        <p className="eyebrow">Verwaltung · NEXUS ONE</p>
        <h1 id="admin-title">Administration<span>.</span></h1>
      </div>
      {session && <form method="post" action="/api/admin/logout">
        <input type="hidden" name="csrf" value={session.csrf} />
        <button className="button button-secondary" type="submit">Abmelden</button>
      </form>}
    </div>

    {notice && <p className={styles.notice} role="status">{notice}</p>}

    {session ? <>
      <nav aria-label="Verwaltungsbereiche" className={styles.tabs}>
        {adminViews.map((item) => <Link key={item} href={`/admin?view=${item}`} aria-current={view === item ? "page" : undefined}>
          {viewLabels[item]}
        </Link>)}
      </nav>
      <Dashboard view={view} csrf={session.csrf} />
    </> : <div className={`${styles.panel} ${styles.login}`}>
      <h2>{configured ? "Administrator-Anmeldung" : "Einrichtung erforderlich"}</h2>
      {configured ? <form method="post" action="/api/admin/login" className={styles.form}>
        <label>E-Mail-Adresse<input type="email" name="email" autoComplete="username" maxLength={254} required /></label>
        <label>Passwort<input type="password" name="password" autoComplete="current-password" maxLength={256} required /></label>
        <button className="button button-primary" type="submit">Anmelden</button>
      </form> : <p>Der geschützte Bereich ist nach der serverseitigen Einrichtung verfügbar. Die Installationsanleitung beschreibt die benötigte Konfiguration.</p>}
    </div>}
  </section>;
}
