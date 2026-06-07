import type { RouteDefinition } from './RouteDefinition';

export interface ResolvedRoute<T> extends RouteDefinition<T> {
  variables: Record<string, string>;
}
