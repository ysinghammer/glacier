import { HttpMethod } from '@glacier/http';

import { RouteNotFound } from './exceptions/RouteNotFound';
import { RouterTrie } from './models/RouterTrie';

import type { ResolvedRoute } from './interfaces/ResolvedRoute';
import type { RouteDefinition } from './interfaces/RouteDefinition';
import type { RouteRequest } from './interfaces/RouteRequest';

export class Router<T> {
  private readonly routerTries: Map<HttpMethod, RouterTrie<RouteDefinition<T>>> = new Map();

  public addRoute(route: RouteDefinition<T>): this {
    let routerTrie = this.routerTries.get(route.method);
    if (typeof routerTrie === 'undefined') {
      routerTrie = new RouterTrie<RouteDefinition<T>>();
      this.routerTries.set(route.method, routerTrie);
    }
    routerTrie.insert(route.path, route);
    return this;
  }

  public getRoute(request: RouteRequest): ResolvedRoute<T> {
    const routerTrie = this.routerTries.get(request.method);
    if (typeof routerTrie === 'undefined') {
      throw new RouteNotFound(request);
    }

    const result = routerTrie.findPath(request.path);
    if (result === undefined) {
      throw new RouteNotFound(request);
    }

    return {
      variables: result.variables,
      ...result.value
    };
  }
}
