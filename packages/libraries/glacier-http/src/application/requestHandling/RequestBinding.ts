import { Schema } from "@glacier/schema";
import type { HttpRequest } from "../../domain/requestHandling/requests/HttpRequest.js";
import type { IHttpBindingMetadata } from "../../domain/requestHandling/routing/IHttpBindingMetadata.js";
import type { IHttpInputIssue } from "../../domain/requestHandling/requests/IHttpInputIssue.js";

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
        const sources = { body, query: request.query, params: request.params, headers, cookies };
        const result = Schema.safeParse(binding.dto, sources[binding.location], {
          coerce: binding.location !== "body",
          coerceSingletonArrays: binding.location === "query",
        });
        if (result.ok) arguments_[binding.index] = result.value;
        else
          for (const issue of result.issues)
            issues.push(
              Object.freeze({
                location: binding.location,
                path: Object.freeze([...issue.path]),
                code: issue.code,
              }),
            );
      } else if (binding.location === "param") {
        // Construction checks the name and matching excludes empty segments before binding.
        arguments_[binding.index] = request.params[binding.name];
      } else if (binding.location === "header")
        arguments_[binding.index] = request.headers.get(binding.name);
      else if (binding.location === "cookie")
        arguments_[binding.index] = request.cookies.get(binding.name);
      else if (binding.location === "request") arguments_[binding.index] = request;
      else arguments_[binding.index] = userId;
    }
    if (issues.length > 0) return { ok: false, issues: Object.freeze(issues) };
    return { ok: true, arguments: arguments_ };
  }
}
