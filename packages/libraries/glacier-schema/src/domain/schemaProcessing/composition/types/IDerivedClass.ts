/** Class produced by a mapped type helper; it can be parsed, extended and decorated like any schema class. */
export type IDerivedClass<T extends object> = new () => T;
