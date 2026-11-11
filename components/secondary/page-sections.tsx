import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import styles from "./secondary.module.css";

export function SecondaryHero({
  label,
  title,
  accent,
  description,
  icon,
}: {
  label: string;
  title: string;
  accent?: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <header className={styles.hero}>
      <div className={styles.heroCopy}>
        <p className={styles.kicker}><span /> {label}</p>
        <h1>{title}{accent && <><br /><em>{accent}</em></>}</h1>
        <p className={styles.lede}>{description}</p>
      </div>
      <div className={styles.heroMark} aria-hidden="true">{icon}</div>
    </header>
  );
}

export function EmptyState({
  icon,
  title,
  children,
  link,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  link?: { href: string; label: string };
}) {
  return (
    <section className={styles.empty}>
      <div className={styles.smallMark} aria-hidden="true">{icon}</div>
      <h2>{title}</h2>
      <p>{children}</p>
      {link && <Link className={styles.textLink} href={link.href}>
        {link.label} <ArrowUpRight size={15} aria-hidden="true" />
      </Link>}
    </section>
  );
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  );
}

export function FilterLinks({
  path,
  label,
  filters,
  selected,
}: {
  path: string;
  label: string;
  filters: readonly { value: string; label: string }[];
  selected: string;
}) {
  return (
    <nav aria-label={label} className={styles.filters}>
      {[{ value: "", label: "Alle" }, ...filters].map((filter) => (
        <Link
          key={filter.value}
          href={filter.value ? { pathname: path, query: { filter: filter.value } } : path}
          aria-current={filter.value === selected ? "page" : undefined}
        >
          {filter.label}
        </Link>
      ))}
    </nav>
  );
}
