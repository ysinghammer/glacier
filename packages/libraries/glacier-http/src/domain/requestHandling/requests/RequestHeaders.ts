import type { IHttpRequestHeaders } from "./types/IHttpRequestHeaders.js";
import type { IRequestNormalizationResult } from "./types/IRequestNormalizationResult.js";

const SENSITIVE_SINGLETONS = new Set([
  "authorization",
  "proxy-authorization",
  "host",
  "content-type",
  "content-length",
  "transfer-encoding",
  "expect",
]);
const EMPTY_FIELDS: readonly string[] = Object.freeze([]);
const COMMA_FIELDS = new Set([
  "accept",
  "accept-encoding",
  "accept-language",
  "cache-control",
  "forwarded",
  "if-match",
  "if-none-match",
  "pragma",
  "via",
  "warning",
]);

// Authorization and Cookie fields must not become loggable own properties on request lookups.
const REQUEST_HEADER_FIELDS = new WeakMap<RequestHeaders, ReadonlyMap<string, readonly string[]>>();

/** Detached header storage preserving occurrences before legal semantic combination. */
export class RequestHeaders implements IHttpRequestHeaders {
  /** Retains receiver validation while keeping credential-bearing fields outside the instance. */
  private get fields(): ReadonlyMap<string, readonly string[]> {
    const fields = REQUEST_HEADER_FIELDS.get(this);
    if (fields === undefined) throw new TypeError("Invalid request header receiver");
    return fields;
  }

  /** Retains only validated detached fields; the private map is never exposed or mutated again. */
  private constructor(fields: ReadonlyMap<string, readonly string[]>) {
    REQUEST_HEADER_FIELDS.set(this, fields);
    Object.freeze(this);
  }

  /** Snapshots Node rawHeaders and rejects sensitive duplicates, even if Node would deduplicate. */
  public static parse(rawHeaders: readonly string[]): IRequestNormalizationResult<RequestHeaders> {
    const fields = new Map<string, readonly string[]>();
    let normalizedName = "";
    for (const [index, value] of rawHeaders.entries()) {
      if (index % 2 === 0) {
        normalizedName = value.toLowerCase();
        continue;
      }
      const existing = fields.get(normalizedName);
      if (existing !== undefined && SENSITIVE_SINGLETONS.has(normalizedName))
        return { ok: false, status: 400 };
      fields.set(normalizedName, Object.freeze([...(existing ?? []), value]));
      if (normalizedName === "transfer-encoding" && value.toLowerCase() !== "chunked")
        return { ok: false, status: 400 };
    }
    return { ok: true, value: new RequestHeaders(fields) };
  }

  /** Combines known list fields only; unknown/non-list fields retain their first occurrence. */
  public get(name: string): string | undefined {
    const fields = this.fields.get(name.toLowerCase());
    if (fields === undefined) return undefined;
    const normalizedName = name.toLowerCase();
    if (normalizedName === "cookie") return fields.join("; ");
    if (COMMA_FIELDS.has(normalizedName)) return fields.join(", ");
    return fields[0];
  }

  /** Returns original occurrences as a readonly frozen list, including an empty list when absent. */
  public getAll(name: string): readonly string[] {
    return this.fields.get(name.toLowerCase()) ?? EMPTY_FIELDS;
  }

  /** Detached normalized fields for DTO binding; occurrences remain available through request lookups. */
  public toRecord(): Readonly<Record<string, string>> {
    const record: Record<string, string> = Object.create(null);
    for (const name of this.fields.keys()) record[name] = String(this.get(name));
    return Object.freeze(record);
  }
}
