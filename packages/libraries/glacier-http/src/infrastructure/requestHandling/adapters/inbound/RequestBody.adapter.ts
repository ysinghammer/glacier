import type { IncomingMessage } from "node:http";
import type { IHttpRequestHeaders } from "../../../../domain/requestHandling/requests/types/IHttpRequestHeaders.js";

const JSON_MEDIA =
  /^application\/(?:json|[!#$%&'*+.^_`|~0-9a-z-]+\+json)(?:\s*;\s*charset\s*=\s*(?:utf-8|"utf-8"))?$/i;

/** Enforces request-body framing and parses bounded JSON from Node HTTP request streams. */
export class RequestBody {
  /**
   * Rejects excessive size, compression, unsupported media, and declared unbound input before reads.
   * @param headers Validated request headers used to inspect body framing and media type.
   * @param hasBodyBinder Whether the selected endpoint declares a body parameter.
   * @param limit Maximum permitted body size in bytes.
   * @returns HTTP rejection status 400, 413, or 415; undefined when reading may proceed.
   */
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

  /**
   * Reads within byte/time bounds and validates fatal UTF-8 and a nonempty JSON object.
   * @param incoming Native request stream to consume.
   * @param limit Maximum accepted body size in bytes.
   * @param timeoutMs Maximum body receive duration in milliseconds.
   * @param requiresJson Whether a nonempty JSON object body is required.
   * @returns Promise resolving to parsed JSON/undefined or a status-400/413 rejection result.
   */
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
