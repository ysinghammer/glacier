import type { IncomingMessage } from "node:http";
import type { IHttpRequestHeaders } from "../../../domain/requests/IHttpRequestHeaders.js";

const JSON_MEDIA =
  /^application\/(?:json|[!#$%&'*+.^_`|~0-9a-z-]+\+json)(?:\s*;\s*charset\s*=\s*(?:utf-8|"utf-8"))?$/i;

/** Bounded Node body adapter; preflight never consumes bytes or sends Continue. */
export class RequestBody {
  /** Rejects declared excess, compression, unsupported media and framed unbound input before body reads. */
  public static preflight(
    headers: IHttpRequestHeaders,
    hasBodyBinder: boolean,
    limit: number,
  ): number | undefined {
    const length = headers.get("content-length");
    if (length !== undefined && Number(length) > limit) return 413;
    if (headers.get("content-encoding") !== undefined) return 415;
    if (!hasBodyBinder) {
      if (length !== undefined && Number(length) > 0) return 400;
      return undefined;
    }
    const media = headers.get("content-type");
    if (media === undefined || !JSON_MEDIA.test(media)) return 415;
    if (
      (length !== undefined && Number(length) === 0) ||
      (length === undefined && headers.get("transfer-encoding") === undefined)
    )
      return 400;
    return undefined;
  }

  /** Reads within byte/time bounds and validates fatal UTF-8 and an actual nonempty JSON object. */
  public static async read(
    incoming: IncomingMessage,
    limit: number,
    timeoutMs: number,
    requiresJson: boolean,
  ): Promise<
    { readonly ok: true; readonly value: unknown } | { readonly ok: false; readonly status: number }
  > {
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    const timeout = setTimeout(
      () => incoming.destroy(new Error("HTTP body receive timeout")),
      timeoutMs,
    );
    try {
      for await (const chunk of incoming.iterator({ destroyOnReturn: false })) {
        // Node's unencoded IncomingMessage stream provides Buffers; no consumer can replace this stream.
        const data: Uint8Array = chunk;
        bytes += data.byteLength;
        if (bytes > limit) return { ok: false, status: 413 };
        if (!requiresJson && bytes > 0) return { ok: false, status: 400 };
        chunks.push(data);
      }
      if (!requiresJson) return { ok: true, value: undefined };
      const text = new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks));
      if (text.length === 0) return { ok: false, status: 400 };
      const value: unknown = JSON.parse(text);
      if (typeof value !== "object" || value === null || Array.isArray(value))
        return { ok: false, status: 400 };
      return { ok: true, value };
    } catch {
      // Decode/JSON/receive failures are expected input rejections, never business error mappings.
      return { ok: false, status: 400 };
    } finally {
      clearTimeout(timeout);
    }
  }
}
