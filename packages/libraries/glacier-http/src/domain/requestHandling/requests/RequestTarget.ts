import type { IHttpQueryObject } from "./types/IHttpQueryObject.js";
import type { IRequestNormalizationResult } from "./types/IRequestNormalizationResult.js";

const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);
const QUERY_KEY = /^[^.[\]]+(?:\[[^.[\]]+\])*$/;

/** Strict origin-form decoding and bounded bracket-query normalization. */
export class RequestTarget {
  /** Rejects malformed/unsafe targets before building detached query structures. */
  public static parse(
    target: string,
    targetBytes: number,
    queryPairs: number,
    queryDepth: number,
  ): IRequestNormalizationResult<{
    readonly pathname: string;
    readonly query: IHttpQueryObject;
  }> {
    if (Buffer.byteLength(target) > targetBytes) return { ok: false, status: 414 };
    if (!target.startsWith("/") || target.includes("#") || /[^\x21-\x7e]/.test(target))
      return { ok: false, status: 400 };
    const separator = target.indexOf("?");
    const path = separator === -1 ? target : target.slice(0, separator);
    const query = separator === -1 ? "" : target.slice(separator + 1);
    const segments: string[] = [];
    for (const segment of path.split("/")) {
      const decoding = RequestTarget.#decode(segment);
      if (!decoding.ok) return decoding;
      const decoded = decoding.value;
      if (
        decoded === "." ||
        decoded === ".." ||
        /[/\\]/.test(decoded) ||
        [...decoded].some(
          (character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
        )
      )
        return { ok: false, status: 400 };
      segments.push(decoded);
    }
    const parsedQuery = RequestTarget.#query(query, queryPairs, queryDepth);
    if (!parsedQuery.ok) return parsedQuery;
    return { ok: true, value: { pathname: segments.join("/"), query: parsedQuery.value } };
  }

  /** Decodes once, promotes repeated scalars and rejects hostile/colliding notation. */
  static #query(
    query: string,
    pairLimit: number,
    depthLimit: number,
  ): IRequestNormalizationResult<IHttpQueryObject> {
    const result: IMutableQueryObject = Object.create(null);
    if (query === "") return { ok: true, value: RequestTarget.#freeze(result) };
    // Count before allocating the split array; total query bytes are already target-bounded.
    let count = 1;
    for (const character of query) {
      if (character === "&") count++;
      if (count > pairLimit) return { ok: false, status: 400 };
    }
    const pairs = query.split("&");
    for (const pair of pairs) {
      const parsed = RequestTarget.#parsePair(pair, depthLimit);
      if (!parsed.ok) return parsed;
      const inserted = RequestTarget.#insert(result, parsed.value.parts, parsed.value.value);
      if (!inserted) return { ok: false, status: 400 };
    }
    return { ok: true, value: RequestTarget.#freeze(result) };
  }

  static #parsePair(
    pair: string,
    depthLimit: number,
  ): IRequestNormalizationResult<{ readonly parts: readonly string[]; readonly value: string }> {
    const separator = pair.indexOf("=");
    const encodedKey = (separator === -1 ? pair : pair.slice(0, separator)).replaceAll("+", " ");
    const encodedValue = (separator === -1 ? "" : pair.slice(separator + 1)).replaceAll("+", " ");
    const keyResult = RequestTarget.#decode(encodedKey);
    if (!keyResult.ok) return keyResult;
    const valueResult = RequestTarget.#decode(encodedValue);
    if (!valueResult.ok) return valueResult;
    if (!QUERY_KEY.test(keyResult.value)) return { ok: false, status: 400 };
    const parts = keyResult.value.replaceAll("]", "").split("[");
    if (parts.length > depthLimit || RequestTarget.#hasForbiddenPart(parts))
      return { ok: false, status: 400 };
    return { ok: true, value: { parts, value: valueResult.value } };
  }

  static #hasForbiddenPart(parts: readonly string[]): boolean {
    return parts.some(
      (part, index) => FORBIDDEN_KEYS.has(part) || (index > 0 && /^\d+$/.test(part)),
    );
  }

  static #insert(root: IMutableQueryObject, parts: readonly string[], value: string): boolean {
    let record = root;
    for (const part of parts.slice(0, -1)) {
      const nested = RequestTarget.#nested(record, part);
      if (nested === undefined) return false;
      record = nested;
    }
    // Validated query keys always contain a final scalar name.
    return RequestTarget.#insertValue(record, String(parts.at(-1)), value);
  }

  static #insertValue(record: IMutableQueryObject, part: string, value: string): boolean {
    const existing = record[part];
    if (existing === undefined) record[part] = value;
    else if (typeof existing === "string") record[part] = [existing, value];
    else if (Array.isArray(existing)) existing.push(value);
    else return false;
    return true;
  }

  static #nested(record: IMutableQueryObject, part: string): IMutableQueryObject | undefined {
    const existing = record[part];
    if (existing === undefined) {
      const nested: IMutableQueryObject = Object.create(null);
      record[part] = nested;
      return nested;
    }
    if (typeof existing === "string" || Array.isArray(existing)) return undefined;
    return existing;
  }

  /** Translates the native decoder's malformed percent/UTF-8 rejection into a typed outcome. */
  static #decode(value: string): IRequestNormalizationResult<string> {
    try {
      return { ok: true, value: decodeURIComponent(value) };
    } catch {
      return { ok: false, status: 400 };
    }
  }

  /** Freezes detached records and repeated scalar arrays recursively. */
  static #freeze(record: IMutableQueryObject): IHttpQueryObject {
    // Configurable depth must not become a JavaScript call-stack limit.
    const pending = [record];
    for (const current of pending) {
      for (const value of Object.values(current)) {
        if (Array.isArray(value)) Object.freeze(value);
        else if (typeof value === "object") pending.push(value);
      }
      Object.freeze(current);
    }
    return record;
  }
}

/** Mutable allocation state, never supplied to consumer hooks before recursive freezing. */
interface IMutableQueryObject {
  [name: string]: string | string[] | IMutableQueryObject;
}
