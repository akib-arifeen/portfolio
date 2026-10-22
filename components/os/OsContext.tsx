"use client";

import { createContext, useContext } from "react";
import type { OsApi } from "@/lib/os/types";

export const OsContext = createContext<OsApi | null>(null);

/** OS services for apps: open/close windows, notify, run actions, sound. Provided by OsShell (desktop) and PhoneShell. */
export function useOs(): OsApi {
  const os = useContext(OsContext);
  if (!os) throw new Error("useOs() must be used inside OsShell or PhoneShell");
  return os;
}
