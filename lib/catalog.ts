export type AppStatus = "listed" | "development" | "beta" | "available" | "paused";

export type CatalogApp = {
  slug: string;
  name: string;
  description: string;
  category: string;
  accent: string;
  icon: string;
  status: AppStatus;
  tagline: string;
  overview: string;
  focus: string[];
  features?: string[];
  benefits?: string[];
};

export const appStatusLabels: Record<AppStatus, string> = {
  listed: "Im Katalog",
  development: "In Entwicklung",
  beta: "Beta",
  available: "Verfügbar",
  paused: "Pausiert",
};

export const catalogApps: CatalogApp[] = [
  {
    slug: "jarvis",
    name: "JARVIS",
    description: "Dein persönlicher KI-Assistent.",
    category: "Künstliche Intelligenz",
    accent: "#9280ff",
    icon: "sparkles",
    status: "listed",
    tagline: "Persönliche Assistenz mit KI",
    overview: "JARVIS steht für persönliche KI-Assistenz im NEXUS ONE Ökosystem. Die Produktidee dreht sich darum, wie KI Menschen bei ihren täglichen Aufgaben unterstützen kann.",
    focus: ["Persönliche Assistenz", "Künstliche Intelligenz", "Alltagsaufgaben"],
  },
  {
    slug: "lingoflow",
    name: "LingoFlow",
    description: "Übersetzungen für verschiedene Sprachen.",
    category: "Produktivität",
    accent: "#45d9ec",
    icon: "languages",
    status: "listed",
    tagline: "Verständigung über Sprachgrenzen hinweg",
    overview: "LingoFlow ist als Übersetzungs-App für verschiedene Sprachen vorgesehen. Im Mittelpunkt steht der Wechsel zwischen Sprachen, etwa beim Lesen oder beim Austausch mit anderen.",
    focus: ["Übersetzung", "Mehrsprachigkeit", "Verständigung"],
  },
  {
    slug: "filemaster",
    name: "FileMaster",
    description: "Deine Dateien an einem Ort organisieren.",
    category: "Produktivität",
    accent: "#5da4ff",
    icon: "folder",
    status: "listed",
    tagline: "Ordnung für deine digitalen Dateien",
    overview: "FileMaster ist die App für Dateiverwaltung im NEXUS ONE Ökosystem. Ihr Schwerpunkt ist der strukturierte Umgang mit den eigenen Dateien.",
    focus: ["Dateiverwaltung", "Organisation", "Übersicht"],
  },
  {
    slug: "musicbox",
    name: "MusicBox",
    description: "Eine Plattform für deine Musik.",
    category: "Medien",
    accent: "#f676c5",
    icon: "music",
    status: "listed",
    tagline: "Ein eigener Platz für deine Musik",
    overview: "MusicBox ist als Musikplattform und zur Musikverwaltung vorgesehen. Im Zentrum steht die eigene Musikbibliothek.",
    focus: ["Musikplattform", "Musikbibliothek", "Musikverwaltung"],
  },
  {
    slug: "pc-remote",
    name: "PC Remote",
    description: "Fernsteuerung für deinen eigenen PC.",
    category: "Geräte & Netzwerk",
    accent: "#6ce6ca",
    icon: "monitor",
    status: "listed",
    tagline: "Zugriff auf den eigenen PC aus der Ferne",
    overview: "PC Remote widmet sich der Fernsteuerung des eigenen PCs. Die Produktidee geht vom eigenen Rechner als Ziel der Verbindung aus.",
    focus: ["Eigener PC", "Fernsteuerung", "Gerätezugriff"],
  },
  {
    slug: "devicehub",
    name: "DeviceHub",
    description: "Eigene Geräte verbinden und verwalten.",
    category: "Geräte & Netzwerk",
    accent: "#6f9cff",
    icon: "devices",
    status: "listed",
    tagline: "Deine Geräte im Überblick",
    overview: "DeviceHub ist für die Verwaltung und Verbindung eigener Geräte vorgesehen. Der Fokus liegt auf dem Gerätebestand und den Verbindungen zwischen diesen Geräten.",
    focus: ["Geräteverwaltung", "Eigene Geräte", "Geräteverbindungen"],
  },
  {
    slug: "servermaster",
    name: "ServerMaster",
    description: "Verwaltung für deine eigenen Server.",
    category: "Geräte & Netzwerk",
    accent: "#63e5a0",
    icon: "server",
    status: "listed",
    tagline: "Ein Platz für deine Serververwaltung",
    overview: "ServerMaster steht für die Verwaltung eigener Server. Die Produktidee richtet sich an Menschen, die ihre eigene Serverumgebung organisieren.",
    focus: ["Serververwaltung", "Eigene Infrastruktur", "Organisation"],
  },
  {
    slug: "nexus-network",
    name: "Nexus Network",
    description: "Die Netzwerkplattform für das Ökosystem.",
    category: "Geräte & Netzwerk",
    accent: "#a18cff",
    icon: "network",
    status: "listed",
    tagline: "Das Netzwerk hinter dem Ökosystem",
    overview: "Nexus Network ist als Netzwerkplattform für das NEXUS ONE Ökosystem vorgesehen. Im Mittelpunkt steht die Verbindung der einzelnen Anwendungen.",
    focus: ["Netzwerkplattform", "Ökosystem", "Verbindung"],
  },
  {
    slug: "remotehelp",
    name: "RemoteHelp",
    description: "Fernwartung und gegenseitige technische Hilfe.",
    category: "Geräte & Netzwerk",
    accent: "#ff9e73",
    icon: "support",
    status: "listed",
    tagline: "Technische Unterstützung aus der Ferne",
    overview: "RemoteHelp ist für Fernwartung und gegenseitige technische Unterstützung gedacht. Im Mittelpunkt steht die Zusammenarbeit, wenn jemand bei einem technischen Problem Hilfe benötigt.",
    focus: ["Fernwartung", "Technische Hilfe", "Zusammenarbeit"],
  },
  {
    slug: "autoflow",
    name: "AutoFlow",
    description: "Aufgaben und Abläufe automatisieren.",
    category: "Automatisierung",
    accent: "#ba8cff",
    icon: "workflow",
    status: "listed",
    tagline: "Wiederkehrende Abläufe als Ausgangspunkt",
    overview: "AutoFlow widmet sich der Automatisierung von Aufgaben und Abläufen. Die Produktidee beginnt bei wiederkehrenden Tätigkeiten, die sich als Ablauf beschreiben lassen.",
    focus: ["Automatisierung", "Aufgaben", "Wiederkehrende Abläufe"],
  },
];

export function getCatalogApp(slug: string) {
  return catalogApps.find((app) => app.slug === slug);
}
