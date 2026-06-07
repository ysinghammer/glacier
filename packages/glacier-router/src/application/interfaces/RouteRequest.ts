import type { HttpMethod } from '@glacier/http';

export interface RouteRequest {
  method: HttpMethod;
  path: string;
}
