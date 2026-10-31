import type { INormalizedProvider } from "../providers/INormalizedProvider.js";
import type { ModuleNode } from "./ModuleNode.js";

/** One provider as registered by one module; its identity keys the shared instance of that registration. */
export interface IProviderRegistration {
  /** The module that owns the provider and resolves its dependencies. */
  readonly module: ModuleNode;
  /** The validated provider. */
  readonly provider: INormalizedProvider;
}
