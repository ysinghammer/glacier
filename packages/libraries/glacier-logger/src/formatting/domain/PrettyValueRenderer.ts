import { SafeValueSerializer } from "../../serialization/domain/SafeValueSerializer.js";

const INDENT = "  ";
const CANONICAL_ERROR_KEYS: ReadonlySet<string> = new Set(["type", "message", "stack", "cause"]);

/**
 * Renders key-value fields and serialised errors as indented plain-text lines. Nested records and
 * arrays (keyed by index) open a block one level deeper; multi-line strings continue one level
 * deeper. Inputs are made safe first, so rendering never throws.
 */
export class PrettyValueRenderer {
  /** Renders `record` as lines starting at `depth` indentation levels. */
  static renderRecord(record: Readonly<Record<string, unknown>>, depth: number): string[] {
    const safeRecord = SafeValueSerializer.serializeRecord(record);
    return PrettyValueRenderer.#renderEntries(safeRecord, depth);
  }

  /** Renders a serialised error under `label`, with its stack, extra properties and cause chain. */
  static renderError(label: string, error: unknown, depth: number): string[] {
    const safeError = SafeValueSerializer.serializeWithin(error, new Set(), 0);
    return PrettyValueRenderer.#renderErrorValue(label, safeError, depth);
  }

  static #renderErrorValue(label: string, value: unknown, depth: number): string[] {
    if (!PrettyValueRenderer.#isSerializedError(value)) {
      return PrettyValueRenderer.#renderEntries({ [label]: value }, depth);
    }
    const description =
      typeof value["stack"] === "string" ? value["stack"] : `${value["type"]}: ${value["message"]}`;
    const [firstLine = "", ...stackLines] = description.split("\n");
    const pad = INDENT.repeat(depth);
    const nestedPad = INDENT.repeat(depth + 1);
    const lines = [`${pad}${label}: ${firstLine.trim()}`];
    for (const line of stackLines) {
      lines.push(`${nestedPad}${line.trim()}`);
    }
    const extraProperties = Object.fromEntries(
      Object.entries(value).filter(([key]) => !CANONICAL_ERROR_KEYS.has(key)),
    );
    lines.push(...PrettyValueRenderer.#renderEntries(extraProperties, depth + 1));
    if ("cause" in value) {
      lines.push(...PrettyValueRenderer.#renderErrorValue("cause", value["cause"], depth + 1));
    }
    return lines;
  }

  static #renderEntries(record: Readonly<Record<string, unknown>>, depth: number): string[] {
    return Object.entries(record).flatMap(([key, value]) =>
      PrettyValueRenderer.#renderEntry(key, value, depth),
    );
  }

  static #renderEntry(key: string, value: unknown, depth: number): string[] {
    const pad = INDENT.repeat(depth);
    if (typeof value === "object" && value !== null) {
      const children = Object.entries(value);
      if (children.length === 0) {
        return [`${pad}${key}: ${Array.isArray(value) ? "[]" : "{}"}`];
      }
      return [
        `${pad}${key}:`,
        ...PrettyValueRenderer.#renderEntries(Object.fromEntries(children), depth + 1),
      ];
    }
    const text = String(value);
    if (!text.includes("\n")) {
      return [`${pad}${key}: ${text}`];
    }
    const nestedPad = INDENT.repeat(depth + 1);
    return [`${pad}${key}:`, ...text.split("\n").map((line) => `${nestedPad}${line}`)];
  }

  static #isSerializedError(value: unknown): value is Record<string, unknown> {
    return (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value) &&
      "type" in value &&
      typeof value.type === "string" &&
      "message" in value &&
      typeof value.message === "string"
    );
  }
}
