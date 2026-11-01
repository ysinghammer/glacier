import { SafeValueSerializer } from "../serialization/SafeValueSerializer.js";

const INDENT = "  ";
const CANONICAL_ERROR_KEYS: ReadonlySet<string> = new Set(["type", "message", "stack", "cause"]);

/** Renders sanitized field values and error data as indented plain-text lines. */
export class PrettyValueRenderer {
  /** Renders record properties at the requested indentation depth.
   * @param record - Structured values to sanitize and render.
   * @param depth - Number of two-space indentation levels before top-level lines.
   * @returns Rendered lines; nested values and multiline text are indented further.
   */
  public static renderRecord(record: Readonly<Record<string, unknown>>, depth: number): string[] {
    const safeRecord = SafeValueSerializer.serializeRecord(record);
    return PrettyValueRenderer.renderEntries(safeRecord, depth);
  }

  /** Renders error-like data beneath a label after safe serialization.
   * @param label - Field label for the error value.
   * @param error - Error or other value to render.
   * @param depth - Number of indentation levels before the labeled value.
   * @returns Indented lines for the label, stack, properties, and any cause chain.
   */
  public static renderError(label: string, error: unknown, depth: number): string[] {
    const safeError = SafeValueSerializer.serializeWithin(error, new Set(), 0);
    return PrettyValueRenderer.renderErrorValue(label, safeError, depth);
  }

  /** Renders a serialized error specially, or renders a non-error as an ordinary field.
   * @param label - Name shown for this value.
   * @param value - Serialized value to inspect and render.
   * @param depth - Current indentation level.
   * @returns Lines representing the value and nested error data.
   */
  private static renderErrorValue(label: string, value: unknown, depth: number): string[] {
    if (!PrettyValueRenderer.isSerializedError(value)) {
      return PrettyValueRenderer.renderEntries({ [label]: value }, depth);
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
    lines.push(...PrettyValueRenderer.renderEntries(extraProperties, depth + 1));
    if ("cause" in value) {
      lines.push(...PrettyValueRenderer.renderErrorValue("cause", value["cause"], depth + 1));
    }
    return lines;
  }

  /** Renders each record entry in enumeration order.
   * @param record - Sanitized key-value data to render.
   * @param depth - Indentation level applied to each key.
   * @returns Rendered lines for all entries.
   */
  private static renderEntries(record: Readonly<Record<string, unknown>>, depth: number): string[] {
    return Object.entries(record).flatMap(([key, value]) =>
      PrettyValueRenderer.renderEntry(key, value, depth),
    );
  }

  /** Renders one value inline or as a nested block.
   * @param key - Property label to display.
   * @param value - Value to represent as text.
   * @param depth - Indentation level for the property label.
   * @returns One or more display lines for the property.
   */
  private static renderEntry(key: string, value: unknown, depth: number): string[] {
    const pad = INDENT.repeat(depth);
    if (typeof value === "object" && value !== null) {
      const children = Object.entries(value);
      if (children.length === 0) {
        return [`${pad}${key}: ${Array.isArray(value) ? "[]" : "{}"}`];
      }
      return [
        `${pad}${key}:`,
        ...PrettyValueRenderer.renderEntries(Object.fromEntries(children), depth + 1),
      ];
    }
    const text = String(value);
    if (!text.includes("\n")) {
      return [`${pad}${key}: ${text}`];
    }
    const nestedPad = INDENT.repeat(depth + 1);
    return [`${pad}${key}:`, ...text.split("\n").map((line) => `${nestedPad}${line}`)];
  }

  /** Checks for the string fields needed to render an error record.
   * @param value - Unknown value to inspect.
   * @returns `true` when `value` has string `type` and `message` properties.
   */
  private static isSerializedError(value: unknown): value is Record<string, unknown> {
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
