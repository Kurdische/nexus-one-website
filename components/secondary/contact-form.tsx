"use client";

import { AlertCircle, CircleCheck, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import styles from "./secondary.module.css";

type ContactStatus =
  | { type: "success"; message: string }
  | { type: "error"; message: string; fields?: Record<string, string> };

type ContactResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export function ContactForm({ enabled }: { enabled: boolean }) {
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<ContactStatus | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || pending) return;

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setPending(true);
    setStatus(null);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json() as ContactResult;
      if (response.ok && result.ok) {
        form.reset();
        setStatus({ type: "success", message: "Deine Nachricht wurde an den Mailserver übergeben." });
      } else if (result.ok === false && typeof result.message === "string") {
        setStatus({ type: "error", message: result.message, fields: result.fieldErrors });
      } else {
        setStatus({ type: "error", message: "Deine Nachricht konnte gerade nicht übermittelt werden. Versuche es später erneut." });
      }
    } catch {
      setStatus({ type: "error", message: "Die Verbindung ist fehlgeschlagen. Prüfe deine Verbindung und versuche es erneut." });
    } finally {
      setPending(false);
    }
  }

  const errors = status?.type === "error" ? status.fields : undefined;

  return (
    <form action="/api/contact" method="post" onSubmit={submit} aria-busy={pending} className={styles.contactForm}>
      <fieldset disabled={!enabled || pending} aria-describedby={!enabled ? "contact-availability" : undefined}>
        <legend>Schreib uns</legend>
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label htmlFor="contact-name">Name</label>
            <input id="contact-name" name="name" placeholder="Dein Name" autoComplete="name" minLength={2} maxLength={100} required
              aria-invalid={Boolean(errors?.name)} aria-describedby={errors?.name ? "contact-name-error" : undefined} />
            {errors?.name && <span className={styles.fieldError} id="contact-name-error">{errors.name}</span>}
          </div>
          <div className={styles.formField}>
            <label htmlFor="contact-email">E-Mail</label>
            <input id="contact-email" name="email" type="email" placeholder="name@beispiel.de" autoComplete="email" maxLength={254} required
              aria-invalid={Boolean(errors?.email)} aria-describedby={errors?.email ? "contact-email-error" : undefined} />
            {errors?.email && <span className={styles.fieldError} id="contact-email-error">{errors.email}</span>}
          </div>
        </div>
        <div className={styles.formField}>
          <label htmlFor="contact-subject">Betreff</label>
          <input id="contact-subject" name="subject" placeholder="Worum geht es?" minLength={3} maxLength={120} required
            aria-invalid={Boolean(errors?.subject)} aria-describedby={errors?.subject ? "contact-subject-error" : undefined} />
          {errors?.subject && <span className={styles.fieldError} id="contact-subject-error">{errors.subject}</span>}
        </div>
        <div className={styles.formField}>
          <label htmlFor="contact-message">Nachricht</label>
          <textarea id="contact-message" name="message" placeholder="Deine Nachricht" rows={5} minLength={10} maxLength={4000} required
            aria-invalid={Boolean(errors?.message)} aria-describedby={errors?.message ? "contact-message-error" : undefined} />
          {errors?.message && <span className={styles.fieldError} id="contact-message-error">{errors.message}</span>}
        </div>
        <div className={styles.honeypot} aria-hidden="true">
          <label htmlFor="contact-website">Website</label>
          <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
        </div>
        {enabled && (
          <>
            <p className={styles.formHint}>Alle Felder sind Pflichtfelder. Deine Angaben werden zur Bearbeitung deiner Nachricht verwendet.</p>
            <button className={styles.sendButton} type="submit"><Send size={17} aria-hidden="true" /> {pending ? "Wird übermittelt …" : "Nachricht senden"}</button>
            <noscript><p className={styles.formHint}>Aktiviere JavaScript, um das Formular zu verwenden.</p></noscript>
          </>
        )}
      </fieldset>
      <div aria-live="polite" aria-atomic="true">
        {status && <p className={styles.formStatus} data-type={status.type}>
          {status.type === "success" ? <CircleCheck size={18} aria-hidden="true" /> : <AlertCircle size={18} aria-hidden="true" />}
          {status.message}
        </p>}
      </div>
    </form>
  );
}
