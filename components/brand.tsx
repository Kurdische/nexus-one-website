import Link from "next/link";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 40 40" fill="none" width="36" height="36">
      <path d="M20 2.5 35.2 11.25v17.5L20 37.5 4.8 28.75v-17.5L20 2.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" opacity=".46" />
      <path d="M12.5 26.4v-13l15 13.2v-13" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12.5" cy="13.4" r="2.25" fill="currentColor" />
      <circle cx="27.5" cy="26.6" r="2.25" fill="currentColor" />
    </svg>
  );
}

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="NEXUS ONE – Home">
      <BrandMark className="brand-mark" />
      <span>NEXUS<span className="brand-one"> ONE</span></span>
    </Link>
  );
}
