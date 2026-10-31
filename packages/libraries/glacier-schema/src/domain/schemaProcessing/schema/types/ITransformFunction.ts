/**
 * Synchronous replacement callback registered by `Transform`.
 * @param value Present input after optional coercion.
 * @returns Replacement value passed to field validation.
 */
export type ITransformFunction = (value: unknown) => unknown;
