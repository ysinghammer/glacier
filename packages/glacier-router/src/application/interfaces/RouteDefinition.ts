import type { HttpMethod } from '@glacier/http';

export interface RouteDefinition<T> {
  method: HttpMethod;
  path: string;
  value: T;
}
