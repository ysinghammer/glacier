import type { RouteRequest } from '../interfaces/RouteRequest';

export class RouteNotFound extends Error {
  public constructor(request: RouteRequest) {
    super('No matching route definition found');
    this.name = 'RouteNotFound';
    this.cause = request;
  }
}
