/** A concrete, instantiable class whose constructor parameters are supplied by the container. */
export type IClassConstructor<T extends object = object> = new (...arguments_: never[]) => T;
