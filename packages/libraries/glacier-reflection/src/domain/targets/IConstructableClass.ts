/** Public constructor signature used only for tuple inference, never invocation. */
export type IConstructableClass<T extends object = object> = abstract new (
  ...arguments_: never[]
) => T;
