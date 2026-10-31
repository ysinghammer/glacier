import { HttpEndpointMetadata } from "../domain/routing/HttpEndpointMetadata.js";
import type { IHttpEndpointMetadata } from "../domain/routing/IHttpEndpointMetadata.js";
import type { IConstructableClass } from "@glacier/reflection";
import { RoutingMetadata } from "../domain/routing/RoutingMetadata.js";

/** Immutable executable routes prepared once for application-owned controller instances. */
export class PreparedRoutes {
  readonly #routes: readonly IPreparedRoute[];

  /** Validates all contracts and equivalent route/method collisions before listening. */
  public constructor(controllers: readonly object[], hasAuthentication: boolean) {
    const routes: IPreparedRoute[] = [];
    for (const controller of controllers) {
      if (typeof controller !== "object" || controller === null)
        throw new TypeError("Register controller instances, not classes");
      // The public metadata reader validates the constructor through reflection before using it.
      const target = controller.constructor as IConstructableClass<object>;
      for (const metadata of HttpEndpointMetadata.read(target)) {
        if (
          !hasAuthentication &&
          metadata.bindings.some((binding) => binding.location === "userId")
        )
          throw new TypeError("UserId requires authentication");
        const signature = metadata.template.replace(/:[^/]+/g, ":");
        if (
          routes.some(
            (route) => route.signature === signature && route.metadata.method === metadata.method,
          )
        )
          throw new TypeError(`Duplicate ${metadata.method} route`);
        if (Object.hasOwn(controller, metadata.handlerName))
          throw new TypeError("HTTP requires a declared instance method, not an instance override");
        const handler: unknown = Reflect.get(controller, metadata.handlerName);
        if (typeof handler !== "function") throw new TypeError("HTTP requires an instance method");
        routes.push({
          metadata,
          signature,
          segments: metadata.template.split("/"),
          controller,
          handler,
        });
      }
    }
    this.#routes = Object.freeze(routes.sort(PreparedRoutes.#compare));
  }

  /** Matches the most-specific path before choosing a method; Allow is stable across registration order. */
  public match(pathname: string, method: string): IRouteMatch | undefined {
    const segments = RoutingMetadata.canonical(pathname).split("/");
    const matches: { route: IPreparedRoute; params: Readonly<Record<string, string>> }[] = [];
    for (const route of this.#routes) {
      if (segments.length !== route.segments.length) continue;
      const params: Record<string, string> = Object.create(null);
      let isMatch = true;
      for (const [index, segment] of route.segments.entries()) {
        const actual = String(segments[index]);
        if (segment.startsWith(":")) {
          if (actual.length === 0) {
            isMatch = false;
            break;
          }
          params[segment.slice(1)] = actual;
        } else if (segment !== actual) {
          isMatch = false;
          break;
        }
      }
      if (isMatch) matches.push({ route, params: Object.freeze(params) });
    }
    const first = matches[0];
    if (first === undefined) return undefined;
    const candidates = matches.filter((match) => match.route.signature === first.route.signature);
    const methods = new Set(candidates.map((match) => match.route.metadata.method));
    const allow = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
      .filter(
        (value) =>
          value === "OPTIONS" ||
          (value === "HEAD"
            ? methods.has("GET")
            : candidates.some((match) => match.route.metadata.method === value)),
      )
      .join(", ");
    const selected = candidates.find(
      (match) => match.route.metadata.method === (method === "HEAD" ? "GET" : method),
    );
    return { allow, selected };
  }

  /** Lexicographic segment precedence makes static routes win even when total static counts tie. */
  static #compare(left: IPreparedRoute, right: IPreparedRoute): number {
    for (const [index, segment] of left.segments.entries()) {
      const other = String(right.segments[index]);
      if (segment.startsWith(":") !== other.startsWith(":"))
        return segment.startsWith(":") ? 1 : -1;
    }
    return left.metadata.template.localeCompare(right.metadata.template);
  }
}

/** Internal executable endpoint; public metadata deliberately omits instances and callbacks. */
interface IPreparedRoute {
  readonly metadata: IHttpEndpointMetadata;
  readonly signature: string;
  readonly segments: readonly string[];
  readonly controller: object;
  readonly handler: Function;
}

/** Internal method selection and stable path-wide protocol response information. */
interface IRouteMatch {
  readonly allow: string;
  readonly selected:
    | { readonly route: IPreparedRoute; readonly params: Readonly<Record<string, string>> }
    | undefined;
}
