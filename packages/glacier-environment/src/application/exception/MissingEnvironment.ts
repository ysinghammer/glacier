export class MissingEnvironment extends Error {
  public readonly name = 'MissingEnvironment';
  public constructor(environmentKey: string) {
    super(`Expected environment variable ${environmentKey} to exist.`);
  }
}
