import type { ReactNode } from "react";
import { AppIcon } from "./app-icon";
import type { CatalogApp } from "@/lib/catalog";
import styles from "./product-artwork.module.css";

const patterns: Record<string, ReactNode> = {
  sparkles: <>
    <ellipse cx="240" cy="143" rx="155" ry="58" transform="rotate(-22 240 143)" />
    <ellipse cx="240" cy="143" rx="155" ry="58" transform="rotate(22 240 143)" />
    <circle cx="240" cy="143" r="109" strokeDasharray="3 7" opacity=".7" />
    <circle cx="365" cy="77" r="4" fill="currentColor" />
    <circle cx="99" cy="177" r="4" fill="currentColor" />
  </>,
  languages: <>
    <rect x="105" y="72" width="132" height="97" rx="23" />
    <rect x="243" y="117" width="132" height="97" rx="23" />
    <path d="M131 102h73m-73 18h51m90 54h74m-74 17h51M158 169l-20 20v-20m195-52 20-20v20" />
  </>,
  folder: <>
    <path d="M94 105a14 14 0 0 1 14-14h49l18 21h155a14 14 0 0 1 14 14v68a14 14 0 0 1-14 14H108a14 14 0 0 1-14-14z" />
    <path d="M119 91V76a12 12 0 0 1 12-12h47l18 19h165a12 12 0 0 1 12 12v70a12 12 0 0 1-12 12h-17" opacity=".6" />
    <path d="M116 188h80m79 0h48" strokeDasharray="3 6" />
  </>,
  music: <>
    <circle cx="240" cy="143" r="107" strokeDasharray="1 6" />
    <circle cx="240" cy="143" r="87" opacity=".5" />
    <path d="M70 143h17m12-18v36m14-51v66m14-87v108m15-84v60m14-49v38m14-21v14m141-14v14m14-26v38m14-49v60m15-84v108m14-87v66m14-51v36m12-18h17" strokeLinecap="round" />
  </>,
  monitor: <>
    <rect x="118" y="73" width="244" height="136" rx="18" />
    <path d="M118 187h244m-146 22v23m48-23v23m-72 0h96" />
    <path d="M103 93H81v31m318 38v31h-22" strokeDasharray="3 5" />
    <circle cx="139" cy="91" r="2" fill="currentColor" />
    <circle cx="147" cy="91" r="2" fill="currentColor" />
  </>,
  devices: <>
    <rect x="106" y="111" width="83" height="61" rx="11" />
    <rect x="307" y="104" width="52" height="76" rx="11" />
    <rect x="211" y="58" width="58" height="41" rx="9" />
    <rect x="212" y="187" width="56" height="42" rx="9" />
    <path d="M189 143h118m-67-44v88" strokeDasharray="4 5" />
  </>,
  server: <>
    <rect x="119" y="68" width="242" height="45" rx="11" />
    <rect x="119" y="120" width="242" height="45" rx="11" />
    <rect x="119" y="172" width="242" height="45" rx="11" />
    <path d="M137 91h28m-28 52h28m-28 52h28m150-104h27m-27 52h27m-27 52h27" strokeDasharray="3 5" />
  </>,
  network: <>
    <path d="m240 51 103 54v76l-103 54-103-54v-76zM137 105l206 76m0-76-206 76m103-130v184" />
    <circle cx="240" cy="51" r="5" fill="currentColor" />
    <circle cx="343" cy="105" r="5" fill="currentColor" />
    <circle cx="343" cy="181" r="5" fill="currentColor" />
    <circle cx="240" cy="235" r="5" fill="currentColor" />
    <circle cx="137" cy="181" r="5" fill="currentColor" />
    <circle cx="137" cy="105" r="5" fill="currentColor" />
  </>,
  support: <>
    <circle cx="149" cy="143" r="47" />
    <circle cx="331" cy="143" r="47" />
    <circle cx="149" cy="143" r="34" strokeDasharray="1 5" />
    <circle cx="331" cy="143" r="34" strokeDasharray="1 5" />
    <path d="M195 143h90M149 96c19-28 50-47 91-47s72 19 91 47m-182 94c19 28 50 47 91 47s72-19 91-47" strokeDasharray="4 6" />
  </>,
  workflow: <>
    <path d="M139 100h22a18 18 0 0 1 18 18v49a18 18 0 0 0 18 18h82a18 18 0 0 0 18-18v-49a18 18 0 0 1 18-18h24m-200 85h22m154 0h24" />
    <rect x="105" y="84" width="34" height="32" rx="8" />
    <rect x="105" y="169" width="34" height="32" rx="8" />
    <rect x="339" y="84" width="34" height="32" rx="8" />
    <rect x="339" y="169" width="34" height="32" rx="8" />
  </>,
};

export function ProductArtwork({ app }: { app: CatalogApp }) {
  return (
    <figure className={styles.artwork}>
      <div className={styles.top} aria-hidden="true">
        <span><i /> NEXUS ONE</span>
        <span>PRODUCT IDENTITY</span>
      </div>
      <div className={styles.visual} aria-hidden="true">
        <svg viewBox="0 0 480 286" fill="none" stroke="currentColor" strokeWidth="1.15">
          <path d="M44 89V54h34m324 0h34v35m0 108v35h-34m-324 0H44v-35" opacity=".45" />
          {Object.hasOwn(patterns, app.icon) ? patterns[app.icon] : patterns.sparkles}
        </svg>
        <AppIcon app={app} className={styles.centerIcon} size={78} />
      </div>
      <figcaption><span>{app.name}</span><span>Designvorschau</span></figcaption>
    </figure>
  );
}
