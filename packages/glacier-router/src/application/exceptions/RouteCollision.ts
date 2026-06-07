export class RouteCollision extends Error {
  public constructor(path: string) {
    super(`Found two routes definitions that match the same path ${path}.`);
    this.name = 'RouteCollision';
    this.cause = path;
  }
}
