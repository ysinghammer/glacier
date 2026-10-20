import type { ILogEntry } from "../../index.js";

/** Fixed instant shared by formatter scenarios. */
export const SAMPLE_INSTANT = new Date("2026-01-02T03:04:05.006Z");

/** Builds an entry with sensible defaults; `overrides` replace any part of it. */
export function sampleEntry(overrides: Partial<ILogEntry> = {}): ILogEntry {
  return {
    level: "info",
    time: SAMPLE_INSTANT,
    context: "Orders",
    message: "order placed",
    bindings: {},
    fields: {},
    ...overrides,
  };
}
