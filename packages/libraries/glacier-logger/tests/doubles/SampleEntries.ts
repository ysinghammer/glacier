import type { ILogEntry } from "../../index.js";

/** Deterministic timestamp shared by formatter test entries. */
export const SAMPLE_INSTANT = new Date("2026-01-02T03:04:05.006Z");

/**
 * Creates a representative log entry, replacing defaults with supplied fields.
 * @param overrides Optional partial entry values merged over the defaults.
 * @returns A new entry object; nested override values retain their supplied identities.
 */
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
