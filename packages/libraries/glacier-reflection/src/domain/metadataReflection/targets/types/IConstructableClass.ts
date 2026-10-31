/** Constructor shape used only to infer parameter tuples; reflection never invokes it.
 * @template T Instance type constructed by the signature.
 * @param arguments_ Never-callable argument tuple retained only for TypeScript inference.
 * @returns Instance type associated with the constructor.
 */
export type IConstructableClass<T extends object = object> = abstract new (
  ...arguments_: never[]
) => T;
