import { HttpEndpointMetadata } from "../../domain/requestHandling/routing/HttpEndpointMetadata.js";
import type { IHttpEndpointMetadata } from "../../domain/requestHandling/routing/types/IHttpEndpointMetadata.js";
import type { IConstructableClass } from "@glacier/reflection";
import { RoutingMetadata } from "../../domain/requestHandling/routing/RoutingMetadata.js";

/** Validates and orders executable routes prepared from application-owned controller instances. */
export class PreparedRoutes {
  /** Frozen route table in matching precedence order; initialized once during construction. */
  private readonly routes: readonly IPreparedRoute[];

  /** Prepares controller routes and rejects invalid registrations before the server listens.
   * @param controllers - Controller instances to inspect; classes are not accepted as instances.
   * @param hasAuthentication - Whether user-ID route bindings have an authentication scheme.
   * @throws {TypeError} If an entry is not an object controller instance.
   */
  public constructor(controllers: readonly object[], hasAuthentication: boolean) {
    const routes: IPreparedRoute[] = [];
    for (const controller of controllers) {
      if (typeof controller !== "object" || controller === null)
        throw new TypeError("Register controller instances, not classes");
      PreparedRoutes.appendControllerRoutes(routes, controller, hasAuthentication);
    }
    this.routes = Object.freeze(routes.sort(PreparedRoutes.compare));
  }

  /** Adds routes declared by one controller after reading its constructor metadata.
   * @param routes - Mutable preparation output receiving the controller's valid routes.
   * @param controller - Controller instance whose declared routes are inspected.
   * @param hasAuthentication - Whether user-ID bindings are supported by configuration.
   * @returns No value; appends the controller's routes to the preparation output.
   */
  private static appendControllerRoutes(
    routes: IPreparedRoute[],
    controller: object,
    hasAuthentication: boolean,
  ): void {
    // The public metadata reader validates the constructor through reflection before using it.
    const target = controller.constructor as IConstructableClass<object>;
    for (const metadata of HttpEndpointMetadata.read(target))
      PreparedRoutes.appendEndpoint(routes, controller, metadata, hasAuthentication);
  }

  /** Validates route authentication, uniqueness, and handler shape before appending a route.
   * @param routes - Mutable route table receiving this endpoint when valid.
   * @param controller - Instance that owns the endpoint handler.
   * @param metadata - Endpoint declaration supplying method, template, and handler name.
   * @param hasAuthentication - Whether user-ID bindings have an authentication scheme.
   * @returns No value; appends the prepared endpoint after all checks pass.
   * @throws {TypeError} For user-ID bindings without authentication.
   * @throws {TypeError} For a duplicate method and normalized route signature.
   * @throws {TypeError} For an own handler override or a non-function handler.
   */
  private static appendEndpoint(
    routes: IPreparedRoute[],
    controller: object,
    metadata: IHttpEndpointMetadata,
    hasAuthentication: boolean,
  ): void {
    if (!hasAuthentication && metadata.bindings.some((binding) => binding.location === "userId"))
      throw new TypeError("UserId requires authentication");
    const signature = metadata.template.replace(/:[^/]+/g, ":");
    const hasDuplicate = routes.some(
      (route) => route.signature === signature && route.metadata.method === metadata.method,
    );
    if (hasDuplicate) throw new TypeError(`Duplicate ${metadata.method} route`);
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

  /** Matches path precedence first, then selects the requested method; HEAD selects GET.
   * @param pathname - Request path to canonicalize and compare with prepared route segments.
   * @param method - Requested HTTP method; HEAD is matched against GET.
   * @returns Undefined for no path; otherwise allowed methods and an optional selected route.
   */
  public match(pathname: string, method: string): IRouteMatch | undefined {
    const segments = RoutingMetadata.canonical(pathname).split("/");
    const matches: { route: IPreparedRoute; params: Readonly<Record<string, string>> }[] = [];
    for (const route of this.routes) PreparedRoutes.appendMatch(matches, route, segments);
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

  /** Adds a route match only when every path segment satisfies its route pattern.
   * @param matches - Mutable matches for the current candidate set.
   * @param route - Prepared route whose segments are compared.
   * @param segments - Canonical request path segments.
   * @returns No value; appends a match only when the route has matching parameters.
   */
  private static appendMatch(
    matches: { route: IPreparedRoute; params: Readonly<Record<string, string>> }[],
    route: IPreparedRoute,
    segments: readonly string[],
  ): void {
    const params = PreparedRoutes.matchSegments(route, segments);
    if (params !== undefined) matches.push({ route, params });
  }

  /** Compares segment counts and values, capturing nonempty parameter segments.
   * @param route - Prepared route pattern with static and named segments.
   * @param segments - Canonical request path segments to test.
   * @returns Frozen parameter values on a full match, or undefined when it does not match.
   */
  private static matchSegments(
    route: IPreparedRoute,
    segments: readonly string[],
  ): Readonly<Record<string, string>> | undefined {
    if (segments.length !== route.segments.length) return undefined;
    const params: Record<string, string> = Object.create(null);
    for (const [index, segment] of route.segments.entries()) {
      const actual = String(segments[index]);
      if (segment.startsWith(":")) {
        if (actual.length === 0) return undefined;
        params[segment.slice(1)] = actual;
      } else if (segment !== actual) return undefined;
    }
    return Object.freeze(params);
  }

  /** Orders static segments before parameters, then uses template order as a stable tie-break.
   * @param left - First prepared route in the comparison.
   * @param right - Second prepared route in the comparison.
   * @returns Negative, zero, or positive according to route precedence.
   */
  private static compare(left: IPreparedRoute, right: IPreparedRoute): number {
    for (const [index, segment] of left.segments.entries()) {
      const other = String(right.segments[index]);
      if (segment.startsWith(":") !== other.startsWith(":"))
        return segment.startsWith(":") ? 1 : -1;
    }
    return left.metadata.template.localeCompare(right.metadata.template);
  }
}

/** Internal route execution data kept separate from public metadata contracts. */
interface IPreparedRoute {
  /** Readonly endpoint declaration used for routing and response behavior. */
  readonly metadata: IHttpEndpointMetadata;
  /** Readonly path signature with parameter names normalized for collision/method grouping. */
  readonly signature: string;
  /** Readonly template segments used for matching; initialized from endpoint metadata. */
  readonly segments: readonly string[];
  /** Readonly owning controller instance used as the handler receiver. */
  readonly controller: object;
  /** Readonly declared instance method captured for dispatch. */
  readonly handler: Function;
}

/** Internal result containing path-wide protocol information and optional method selection. */
interface IRouteMatch {
  /** Readonly stable Allow header value, including implicit OPTIONS and applicable HEAD. */
  readonly allow: string;
  /** Readonly selected route and path parameters, or undefined when the method is unsupported. */
  readonly selected:
    | { readonly route: IPreparedRoute; readonly params: Readonly<Record<string, string>> }
    | undefined;
}
