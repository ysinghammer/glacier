import type { IClassProvider } from "./IClassProvider.js";
import type { IExistingProvider } from "./IExistingProvider.js";
import type { IFactoryProvider } from "./IFactoryProvider.js";
import type { IValueProvider } from "./IValueProvider.js";

/** Validated explicit provider form; bare classes are expanded and supplied token references are preserved. */
export type INormalizedProvider =
  | IClassProvider
  | IValueProvider
  | IFactoryProvider
  | IExistingProvider;
