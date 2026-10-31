import type { IClassConstructor } from "./IClassConstructor.js";
import type { IClassProvider } from "./IClassProvider.js";
import type { IExistingProvider } from "./IExistingProvider.js";
import type { IFactoryProvider } from "./IFactoryProvider.js";
import type { IValueProvider } from "./IValueProvider.js";

/** Provider declaration accepted by modules, including bare-class shorthand for class providers. */
export type IProvider =
  | IClassConstructor
  | IClassProvider
  | IValueProvider
  | IFactoryProvider
  | IExistingProvider;
