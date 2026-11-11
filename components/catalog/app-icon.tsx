import type { CSSProperties, ReactNode } from "react";
import {
  AppWindow, AudioLines, Boxes, Folder, Headphones, Languages, Monitor,
  Network, Server, Sparkles, Workflow,
} from "lucide-react";
import type { CatalogApp } from "@/lib/catalog";
import styles from "./app-icon.module.css";

const icons: Record<string, ReactNode> = {
  sparkles: <Sparkles strokeWidth={1.65} />,
  languages: <Languages strokeWidth={1.65} />,
  folder: <Folder strokeWidth={1.65} />,
  music: <AudioLines strokeWidth={1.65} />,
  monitor: <Monitor strokeWidth={1.65} />,
  devices: <Boxes strokeWidth={1.65} />,
  server: <Server strokeWidth={1.65} />,
  network: <Network strokeWidth={1.65} />,
  support: <Headphones strokeWidth={1.65} />,
  workflow: <Workflow strokeWidth={1.65} />,
};

export function AppIcon({
  app,
  className,
  size = 50,
}: {
  app: Pick<CatalogApp, "accent" | "icon">;
  className?: string;
  size?: number;
}) {
  const style = { "--icon-size": `${size}px`, "--icon-accent": app.accent } as CSSProperties;

  return (
    <span className={[styles.icon, className].filter(Boolean).join(" ")} style={style} aria-hidden="true">
      {Object.hasOwn(icons, app.icon) ? icons[app.icon] : <AppWindow strokeWidth={1.65} />}
    </span>
  );
}
