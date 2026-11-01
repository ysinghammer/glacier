import type { INormalizedProvider } from "../../providers/types/INormalizedProvider.js";
import type { ModuleNode } from "../ModuleNode.js";

/** Validated provider registration owned by one module and used as its instance-cache identity. */
export interface IProviderRegistration {
  /** Module that owns the provider and supplies its dependency visibility. */
  readonly module: ModuleNode;
  /** Provider declaration after normalization and validation. */
  readonly provider: INormalizedProvider;
}
