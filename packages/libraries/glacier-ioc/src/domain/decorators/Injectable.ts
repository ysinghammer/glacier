import type { IInjectableOptions } from "../metadata/IInjectableOptions.js";
import { INJECTABLE_SCOPE_METADATA } from "../metadata/InjectableScopeMetadata.js";

/**
 * Class decorator that marks a class as a provider and declares its scope (default `"default"`).
 * Records metadata only; nothing is constructed or registered. The scope is read from the class itself,
 * never inherited. Compiler-emitted constructor types additionally require
 * `@glacier/reflection/register` and `emitDecoratorMetadata`.
 */
export function Injectable(options: IInjectableOptions = {}): ClassDecorator {
  return INJECTABLE_SCOPE_METADATA.decorator(options.scope ?? "default");
}
