import { Schema } from "@glacier/schema";
import type { HttpRequest } from "../../domain/requestHandling/requests/HttpRequest.js";
import type { IHttpBindingMetadata } from "../../domain/requestHandling/routing/types/IHttpBindingMetadata.js";
import type { IHttpInputIssue } from "../../domain/requestHandling/requests/types/IHttpInputIssue.js";

/** Request-local explicit binding; no values or options are cached across controller invocations. */
export class RequestBinding {
  /** Coerces only textual DTO locations; malformed input returns value-free typed issues. */
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
