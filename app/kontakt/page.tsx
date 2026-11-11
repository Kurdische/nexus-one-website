import { ArrowUpRight, CircleAlert, Mail, MessagesSquare } from "lucide-react";
import Link from "next/link";
import { ContactForm } from "@/components/secondary/contact-form";
import { SecondaryHero } from "@/components/secondary/page-sections";
import styles from "@/components/secondary/secondary.module.css";
import { pageMetadata } from "@/lib/metadata";
import { isContactConfigured } from "@/lib/server/contact";
import { requireWebsitePage } from "@/lib/server/website-access";

export const metadata = pageMetadata("Kontakt", "Kontakt zu NEXUS ONE für Fragen, Feedback und Anregungen zum App-Ökosystem.", "/kontakt");
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  await requireWebsitePage();
  const enabled = isContactConfigured();

  return (
    <div className={`site-container ${styles.page}`}>
      <SecondaryHero
        label="Kontakt"
        title="Fragen oder Ideen?"
        accent="Wir hören zu."
        description="Hier ist Platz für Fragen zu unseren Apps, Rückmeldungen und Vorschläge für das NEXUS ONE Ökosystem."
        icon={<MessagesSquare size={33} strokeWidth={1.4} />}
      />

      <section className={styles.contactGrid} aria-label="Kontaktformular und Hinweise">
        <ContactForm enabled={enabled} />
        <aside className={styles.contactAside}>
          <div className={styles.smallMark} aria-hidden="true">{enabled ? <Mail size={20} /> : <CircleAlert size={20} />}</div>
          <h2 id="contact-availability">{enabled ? "Dein Anliegen" : "Versand noch nicht eingerichtet"}</h2>
          <p>{enabled
            ? "Wenn es um eine bestimmte Anwendung geht, gib ihren Namen und gegebenenfalls die verwendete Plattform an."
            : "Das Formular wird freigeschaltet, sobald ein Mailserver für NEXUS ONE eingerichtet ist."}</p>
          <Link className={styles.textLink} href="/apps">Zu den App-Produktseiten <ArrowUpRight size={16} aria-hidden="true" /></Link>
        </aside>
      </section>
    </div>
  );
}
