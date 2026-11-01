/**
 * Class produced by a mapped-type helper and usable as a schema class.
 * @template T Instance shape parsed by the generated class.
 */
export type IDerivedClass<T extends object> = new () => T;
