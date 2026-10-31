import type { IClassProvider } from "./IClassProvider.js";
import type { IExistingProvider } from "./IExistingProvider.js";
import type { IFactoryProvider } from "./IFactoryProvider.js";
import type { IValueProvider } from "./IValueProvider.js";

/** A validated provider with the shorthand expanded; its `provide` is always a plain token. */
export type INormalizedProvider =
  | IClassProvider
  | IValueProvider
  | IFactoryProvider
  | IExistingProvider;
