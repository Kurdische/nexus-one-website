"use client";

import { Download, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Brand } from "./brand";

const links = [
  { href: "/", label: "Home" },
  { href: "/apps", label: "Apps" },
  { href: "/oekosystem", label: "Ökosystem" },
  { href: "/updates", label: "Updates" },
  { href: "/ueber-uns", label: "Über uns" },
  { href: "/kontakt", label: "Kontakt" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const open = openOn === pathname;

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenOn(null);
        menuButton.current?.focus();
      }
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <header className="site-header">
      <div className="site-container header-inner">
        <Brand />
        <button className="menu-toggle" type="button" ref={menuButton} aria-expanded={open} aria-controls="site-navigation" aria-label={open ? "Menü schließen" : "Menü öffnen"} onClick={() => setOpenOn(open ? null : pathname)}>
          {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
        <nav id="site-navigation" className={`site-nav${open ? " site-nav-open" : ""}`} aria-label="Hauptnavigation">
          {links.map(({ href, label }) => {
            const active = href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
            return <Link key={href} href={href} aria-current={active ? "page" : undefined} onClick={() => setOpenOn(null)}>{label}</Link>;
          })}
          <Link className="mobile-download" href="/downloads" aria-current={pathname === "/downloads" ? "page" : undefined} onClick={() => setOpenOn(null)}><Download size={16} aria-hidden="true" /> Downloads</Link>
        </nav>
        <Link className="header-download" href="/downloads" aria-current={pathname === "/downloads" ? "page" : undefined}><Download size={15} aria-hidden="true" /> Downloads</Link>
      </div>
    </header>
  );
}
