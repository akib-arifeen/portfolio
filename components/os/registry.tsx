// AppId → component. Static imports are fine: the whole laptop layer is one lazy chunk (Hero → dynamic Desk).
import type { ComponentType } from "react";
import type { AppId, AppProps } from "@/lib/os/types";
import About from "./apps/About";
import Browser from "./apps/Browser";
import Calendar from "./apps/Calendar";
import Files from "./apps/Files";
import Mail from "./apps/Mail";
import Music from "./apps/Music";
import Notes from "./apps/Notes";
import Photos from "./apps/Photos";
import Playground from "./apps/Playground";
import Preview from "./apps/Preview";
import Terminal from "./apps/Terminal";

export const appComponents: Record<AppId, ComponentType<AppProps>> = {
  files: Files,
  browser: Browser,
  notes: Notes,
  photos: Photos,
  music: Music,
  calendar: Calendar,
  mail: Mail,
  terminal: Terminal,
  playground: Playground,
  preview: Preview,
  about: About,
};
