import { Schema } from "@glacier/schema";
import type { HttpRequest } from "../../domain/requestHandling/requests/HttpRequest.js";
import type { IHttpBindingMetadata } from "../../domain/requestHandling/routing/types/IHttpBindingMetadata.js";
import type { IHttpInputIssue } from "../../domain/requestHandling/requests/types/IHttpInputIssue.js";

/** Resolves declared controller arguments from one request without retaining invocation data. */
export class RequestBinding {
  /** Binds DTO and framework values by declared argument index; text DTO sources may be coerced.
   * @param bindings - Ordered metadata declarations; each index selects its output argument slot.
   * @param request - Current request supplying query, route, header, cookie, or request values.
   * @param body - Untrusted body input; parsed without text coercion for body DTOs.
   * @param headers - Header values used as a DTO source; keys follow the binding contract.
   * @param cookies - Cookie values used as a DTO source; keys follow the binding contract.
   * @param userId - Authenticated user identifier, or undefined when unavailable.
   * @returns Success with a new indexed array, or failure with frozen value-free issues.
   */
  public static bind(
    bindings: readonly IHttpBindingMetadata[],
    request: HttpRequest,
    body: unknown,
    headers: Readonly<Record<string, string>>,
    cookies: Readonly<Record<string, string>>,
    userId: string | undefined,
  ):
    | { readonly ok: true; readonly arguments: readonly unknown[] }
    | { readonly ok: false; readonly issues: readonly IHttpInputIssue[] } {
    const arguments_: unknown[] = [];
    const issues: IHttpInputIssue[] = [];
    for (const binding of bindings) {
      if ("dto" in binding) {
        const result = RequestBinding.parse(binding, request, body, headers, cookies);
        if (result.ok) arguments_[binding.index] = result.value;
        else issues.push(...result.issues);
        continue;
      }
      arguments_[binding.index] = RequestBinding.value(binding, request, userId);
    }
    if (issues.length > 0) return { ok: false, issues: Object.freeze(issues) };
    return { ok: true, arguments: arguments_ };
  }

  /** Parses one DTO binding and converts validation failures to location-aware safe issues.
   * @param binding - DTO declaration identifying the input location and argument index.
   * @param request - Current request used for query and route-parameter sources.
   * @param body - Untrusted body value; body parsing does not coerce text.
   * @param headers - Header source for this request, without additional normalization.
   * @param cookies - Cookie source for this request, without additional normalization.
   * @returns Parsed value, or issues containing location, path, and code but no input values.
   */
  private static parse(
    binding: Extract<IHttpBindingMetadata, { readonly dto: unknown }>,
    request: HttpRequest,
    body: unknown,
    headers: Readonly<Record<string, string>>,
    cookies: Readonly<Record<string, string>>,
  ):
    | { readonly ok: true; readonly value: unknown }
    | { readonly ok: false; readonly issues: readonly IHttpInputIssue[] } {
    const sources = { body, query: request.query, params: request.params, headers, cookies };
    const result = Schema.safeParse(binding.dto, sources[binding.location], {
      coerce: binding.location !== "body",
      coerceSingletonArrays: binding.location === "query",
    });
    if (result.ok) return result;
    return {
      ok: false,
      issues: result.issues.map((issue) =>
        Object.freeze({
          location: binding.location,
          path: Object.freeze([...issue.path]),
          code: issue.code,
        }),
      ),
    };
  }

  /** Selects a non-DTO framework value from the current request context.
   * @param binding - Non-DTO declaration specifying the value to resolve.
   * @param request - Current request for request, route, header, and cookie values.
   * @param userId - Authenticated identifier, or undefined when not supplied.
   * @returns The selected value; request-derived values may be undefined when absent.
   */
  private static value(
    binding: Exclude<IHttpBindingMetadata, { readonly dto: unknown }>,
    request: HttpRequest,
    userId: string | undefined,
  ): unknown {
    switch (binding.location) {
      case "param":
        // Construction checks the name and matching excludes empty segments before binding.
        return request.params[binding.name];
      case "header":
        return request.headers.get(binding.name);
      case "cookie":
        return request.cookies.get(binding.name);
      case "request":
        return request;
      case "userId":
        return userId;
    }
  }
}
