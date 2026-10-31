import type { IHttpQueryObject } from "./IHttpQueryObject.js";
import type { IRequestNormalizationResult } from "./IRequestNormalizationResult.js";

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
    if (query !== "") {
      // Count before allocating the split array; total query bytes are already target-bounded.
      let count = 1;
      for (const character of query) {
        if (character === "&") count++;
        if (count > pairLimit) return { ok: false, status: 400 };
      }
      const pairs = query.split("&");
      for (const pair of pairs) {
        const separator = pair.indexOf("=");
        const keyResult = RequestTarget.#decode(
          (separator === -1 ? pair : pair.slice(0, separator)).replaceAll("+", " "),
        );
        if (!keyResult.ok) return keyResult;
        const valueResult = RequestTarget.#decode(
          (separator === -1 ? "" : pair.slice(separator + 1)).replaceAll("+", " "),
        );
        if (!valueResult.ok) return valueResult;
        const key = keyResult.value;
        const value = valueResult.value;
        if (!QUERY_KEY.test(key)) return { ok: false, status: 400 };
        const parts = key.replaceAll("]", "").split("[");
        if (parts.length > depthLimit) return { ok: false, status: 400 };
        if (
          parts.some((part, index) => FORBIDDEN_KEYS.has(part) || (index > 0 && /^\d+$/.test(part)))
        )
          return { ok: false, status: 400 };
        let record = result;
        for (const [index, part] of parts.entries()) {
          const existing = record[part];
          if (index === parts.length - 1) {
            if (existing === undefined) record[part] = value;
            else if (typeof existing === "string") record[part] = [existing, value];
            else if (Array.isArray(existing)) existing.push(value);
            else return { ok: false, status: 400 };
          } else {
            if (existing === undefined) {
              const nested: IMutableQueryObject = Object.create(null);
              record[part] = nested;
              record = nested;
            } else if (typeof existing === "string" || Array.isArray(existing))
              return { ok: false, status: 400 };
            else record = existing;
          }
        }
      }
    }
    return { ok: true, value: RequestTarget.#freeze(result) };
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
