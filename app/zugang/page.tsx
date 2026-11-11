import type { Metadata } from "next";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { BrandMark } from "@/components/brand";
import { safeWebsiteDestination } from "@/lib/server/website-access";
import styles from "./access.module.css";

export const metadata: Metadata = {
  title: "Zugang",
  description: "Geschützter Zugang zur NEXUS ONE Website.",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const notices = {
  invalid: "Der Zugang konnte mit diesem Code nicht freigeschaltet werden. Prüfe, ob der Code für die NEXUS ONE Website gültig und noch verfügbar ist.",
  limited: "Es gab zu viele Versuche. Warte einen Moment, bevor du es erneut versuchst.",
  unavailable: "Der Zugangsdienst ist gerade nicht erreichbar. Bitte versuche es später erneut.",
};

type AccessProps = { searchParams: Promise<{ next?: string | string[]; notice?: string | string[] }> };

export default async function AccessPage({ searchParams }: AccessProps) {
  const query = await searchParams;
  const notice = typeof query.notice === "string" && Object.hasOwn(notices, query.notice)
    ? notices[query.notice as keyof typeof notices]
    : null;

  return (
    <section className={styles.screen} aria-labelledby="access-title">
      <div className={styles.orbit} aria-hidden="true" />
      <div className={`site-container ${styles.container}`}>
        <div className={styles.panel}>
          <BrandMark className={styles.mark} />
          <p className="eyebrow"><LockKeyhole size={14} aria-hidden="true" /> Geschützter Bereich</p>
          <h1 id="access-title">Dein Zugang zu<br /> NEXUS <span>ONE.</span></h1>
          <p className={styles.intro}>Gib deinen Zugangscode ein, um die Website freizuschalten.</p>

          {notice && <p id="access-notice" className={styles.notice} role="alert">{notice}</p>}
          <form className={styles.form} action="/api/zugang" method="post">
            <input type="hidden" name="next" value={safeWebsiteDestination(query.next)} />
            <label htmlFor="website-code">Zugangscode</label>
            <input
              type="password"
              id="website-code"
              name="code"
              autoComplete="one-time-code"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={160}
              aria-describedby={notice ? "access-notice" : undefined}
              required
            />
            <button type="submit" className="button button-primary">Website freischalten <ArrowRight size={17} aria-hidden="true" /></button>
          </form>
        </div>
      </div>
    </section>
  );
}
