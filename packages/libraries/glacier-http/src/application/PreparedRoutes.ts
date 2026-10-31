import { Schema } from "@glacier/schema";
import { RoutingMetadata } from "../domain/routing/RoutingMetadata.js";
import type { IApiResponseOptions } from "../domain/routing/IApiResponseOptions.js";

/** Own zero-argument GET endpoints required to exercise the phase-03 transport values. */
export class PreparedRoutes {
  readonly #routes: readonly IPreparedRoute[];

  /** Prepares registered instances without invoking controllers; unsupported binders remain deferred. */
  public constructor(controllers: readonly object[]) {
    const routes: IPreparedRoute[] = [];
    for (const controller of controllers) {
      if (typeof controller === "function")
        throw new TypeError("Register controller instances, not classes");
      const prefix = RoutingMetadata.require(
        RoutingMetadata.controller.readDynamic(controller, { kind: "class", inheritance: "own" }),
      );
      const prototype: unknown = Object.getPrototypeOf(controller);
      for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(prototype))) {
        const declaration = RoutingMetadata.optional(
          RoutingMetadata.route.readDynamic(controller, {
            kind: "member",
            member: key,
            inheritance: "own",
          }),
        );
        if (declaration === undefined) continue;
        if (typeof descriptor.value !== "function" || descriptor.value.length !== 0)
          throw new TypeError("Minimal routes require zero-argument methods");
        const response = RoutingMetadata.require(
          RoutingMetadata.response.readDynamic(controller, {
            kind: "member",
            member: key,
            inheritance: "own",
          }),
        );
        if (response.status !== 204) Schema.prepare(response.type);
        const template = PreparedRoutes.#canonical(
          `${prefix.path === "/" ? "" : prefix.path}${declaration.path}`,
        );
        const signature = template.replace(/:[^/]+/g, ":");
        if (routes.some((route) => route.signature === signature))
          throw new TypeError("Duplicate GET route");
        const names = template.split("/").filter((part) => part.startsWith(":"));
        if (new Set(names).size !== names.length) throw new TypeError("Duplicate route parameter");
        routes.push({
          template,
          signature,
          segments: template.split("/"),
          controller,
          handler: descriptor.value,
          response,
        });
      }
    }
    this.#routes = Object.freeze(
      routes.sort(
        (left, right) => PreparedRoutes.#specificity(right) - PreparedRoutes.#specificity(left),
      ),
    );
  }

  /** Matches case-sensitively without collapsing repeated slashes; one trailing slash is equivalent. */
  public match(
    pathname: string,
  ):
    | { readonly route: IPreparedRoute; readonly params: Readonly<Record<string, string>> }
    | undefined {
    const segments = PreparedRoutes.#canonical(pathname).split("/");
    for (const route of this.#routes) {
      if (segments.length !== route.segments.length) continue;
      const params: Record<string, string> = Object.create(null);
      let isMatch = true;
      for (const [index, segment] of route.segments.entries()) {
        // The equal-length check above proves the indexed segment is present.
        const actual = String(segments[index]);
        if (segment.startsWith(":")) params[segment.slice(1)] = actual;
        else if (segment !== actual) {
          isMatch = false;
          break;
        }
      }
      if (isMatch) return { route, params: Object.freeze(params) };
    }
    return undefined;
  }

  /** Removes exactly one trailing slash, never root or interior repeated separators. */
  static #canonical(path: string): string {
    return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
  }

  /** Static segment count orders otherwise equivalent candidates ahead of parameters. */
  static #specificity(route: IPreparedRoute): number {
    return route.segments.filter((segment) => !segment.startsWith(":")).length;
  }
}

/** Private executable endpoint snapshot, not a public metadata registry. */
interface IPreparedRoute {
  readonly template: string;
  readonly signature: string;
  readonly segments: readonly string[];
  readonly controller: object;
  readonly handler: (...arguments_: never[]) => unknown;
  readonly response: IApiResponseOptions;
}
