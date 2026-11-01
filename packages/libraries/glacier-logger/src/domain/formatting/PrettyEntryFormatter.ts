import type { IEntryFormatter } from "../../application/logging/ports/outbound/IEntryFormatter.port.js";
import type { ILogEntry } from "../logging/types/ILogEntry.js";
import type { IOutputTone } from "./types/IOutputTone.js";
import type { IPrettyFormatterOptions } from "./types/IPrettyFormatterOptions.js";
import type { IStyledOutput } from "./types/IStyledOutput.js";
import { OutputPalette } from "./OutputPalette.js";
import { PrettyValueRenderer } from "./PrettyValueRenderer.js";

const LEVEL_LABEL_WIDTH = 5;
const MESSAGE_CONTINUATION_INDENT = "    ";
const INVALID_TIME_PLACEHOLDER = "??:??:??.???";
const FIELD_DEPTH = 1;

interface IOutputSegment {
  /** Literal header text rendered in sequence. */
  readonly text: string;
  /** Optional emphasis applied when color output is enabled. */
  readonly tone?: IOutputTone;
}

/** Formats log entries as readable text or browser-console text and style arguments. */
export class PrettyEntryFormatter implements IEntryFormatter {
  /** Color setting copied from constructor options and retained for this formatter's lifetime. */
  private readonly isColorEnabled: boolean;

  /** Creates a formatter with the caller-selected color behavior.
   * @param options - Whether color styling is enabled; no environment check is performed here.
   */
  constructor(options: IPrettyFormatterOptions) {
    this.isColorEnabled = options.isColorEnabled;
  }

  /** Formats the header and body as newline-separated human-readable text.
   * @param entry - Normalized log record to display.
   * @returns Text with UTC time and optional ANSI color sequences.
   */
  public format(entry: ILogEntry): string {
    const header = this.headerSegments(entry)
      .map((segment) => this.renderAnsi(segment))
      .join("");
    return [header, ...PrettyEntryFormatter.bodyLines(entry)].join("\n");
  }

  /** Formats browser-console text and the style arguments corresponding to its `%c` directives.
   * Literal percent signs are escaped; color-disabled output has no directives.
   * @param entry - Normalized log record to display.
   * @returns Console format and styles, with one style pair for each styled segment.
   */
  public formatStyled(entry: ILogEntry): IStyledOutput {
    const styles: string[] = [];
    const header = this.headerSegments(entry)
      .map((segment) => this.renderCss(segment, styles))
      .join("");
    const body = PrettyEntryFormatter.bodyLines(entry).map(
      (line) => `\n${PrettyEntryFormatter.escapeDirectives(line)}`,
    );
    return { format: `${header}${body.join("")}`, styles };
  }

  /** Builds ordered header segments for time, level, context, and message.
   * @param entry - Normalized record supplying header values.
   * @returns Segments with visual tones assigned to time, level, and context.
   */
  private headerSegments(entry: ILogEntry): IOutputSegment[] {
    const label = entry.level.toUpperCase().padEnd(LEVEL_LABEL_WIDTH);
    const message = entry.message.replaceAll("\n", `\n${MESSAGE_CONTINUATION_INDENT}`);
    return [
      { text: PrettyEntryFormatter.formatTime(entry.time), tone: "subdued" },
      { text: " " },
      { text: label, tone: entry.level },
      { text: " " },
      { text: `[${entry.context}]`, tone: "subdued" },
      { text: ` ${message}` },
    ];
  }

  /** Renders one segment with ANSI styling when configured and toned.
   * @param segment - Text and optional tone to render.
   * @returns Segment text, styled only when color is enabled.
   */
  private renderAnsi(segment: IOutputSegment): string {
    if (!this.isColorEnabled || segment.tone === undefined) {
      return segment.text;
    }
    return OutputPalette.paintAnsi(segment.text, segment.tone);
  }

  /** Escapes and renders one browser segment, appending its CSS style arguments if needed.
   * @param segment - Text and optional tone to render.
   * @param styles - Mutable style list extended for styled segments.
   * @returns Console format fragment, including `%c` directives when styled.
   */
  private renderCss(segment: IOutputSegment, styles: string[]): string {
    const text = PrettyEntryFormatter.escapeDirectives(segment.text);
    if (!this.isColorEnabled || segment.tone === undefined) {
      return text;
    }
    styles.push(OutputPalette.cssStyleFor(segment.tone), "");
    return `%c${text}%c`;
  }

  /** Renders bindings, call fields, and the optional error beneath the header.
   * @param entry - Normalized record whose body data is rendered.
   * @returns Indented body lines; call fields override same-named bindings.
   */
  private static bodyLines(entry: ILogEntry): string[] {
    const lines = PrettyValueRenderer.renderRecord(
      { ...entry.bindings, ...entry.fields },
      FIELD_DEPTH,
    );
    if (entry.error !== undefined) {
      lines.push(...PrettyValueRenderer.renderError("err", entry.error, FIELD_DEPTH));
    }
    return lines;
  }

  /** Escapes literal percent characters for console format-string handling.
   * @param text - Text that must not introduce console directives.
   * @returns Text with every percent sign doubled.
   */
  private static escapeDirectives(text: string): string {
    return text.replaceAll("%", "%%");
  }

  /** Formats a date as UTC time with milliseconds or an invalid-time placeholder.
   * @param time - Timestamp to format.
   * @returns `HH:mm:ss.SSS` in UTC, or `??:??:??.???` for an invalid date.
   */
  private static formatTime(time: Date): string {
    if (Number.isNaN(time.getTime())) {
      return INVALID_TIME_PLACEHOLDER;
    }
    return time.toISOString().slice(11, 23);
  }
}
