import type { IInjectableOptions } from "../metadata/types/IInjectableOptions.js";
import { INJECTABLE_SCOPE_METADATA } from "../metadata/InjectableScopeMetadata.js";

/**
 * Marks a class as injectable and records its own provider scope; it does not construct or register it.
 * @param options Scope declaration; omitted options or scope selects `"default"`.
 * @returns A class decorator that records metadata on the decorated class only.
 * @remarks Implicit constructor types require reflection registration and emitted metadata.
 */
export function Injectable(options: IInjectableOptions = {}): ClassDecorator {
  return INJECTABLE_SCOPE_METADATA.decorator(options.scope ?? "default");
}
