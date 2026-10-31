import type { IClassConstructor } from "./IClassConstructor.js";
import type { IClassProvider } from "./IClassProvider.js";
import type { IExistingProvider } from "./IExistingProvider.js";
import type { IFactoryProvider } from "./IFactoryProvider.js";
import type { IValueProvider } from "./IValueProvider.js";

/** Every accepted provider form; a bare class is shorthand for `{ provide: Foo, useClass: Foo }`. */
export type IProvider =
  | IClassConstructor
  | IClassProvider
  | IValueProvider
  | IFactoryProvider
  | IExistingProvider;
