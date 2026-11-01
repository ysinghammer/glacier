/** Extracts the visible parameter tuple from a callable type; overloads use the final signature.
 * @template T Callable type whose exposed argument tuple is extracted.
 */
export type IMethodParameters<T> = T extends (...arguments_: infer P) => unknown ? P : never;
