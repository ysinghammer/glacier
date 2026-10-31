/**
 * Instantiable class type whose constructor arguments can be supplied by dependency injection.
 * @template T Constructed instance type; defaults to `object`.
 */
export type IClassConstructor<T extends object = object> = new (...arguments_: never[]) => T;
