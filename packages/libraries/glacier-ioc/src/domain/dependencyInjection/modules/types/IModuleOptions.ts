import type { IProvider } from "../../providers/types/IProvider.js";
import type { IModuleExport } from "./IModuleExport.js";
import type { IModuleReference } from "./IModuleReference.js";

/** Optional static or dynamic module declarations; dynamic values append to decorator metadata. */
export interface IModuleOptions {
  /**
   * Providers owned by this module; unexported providers remain private.
   * @default Empty list when omitted.
   */
  readonly providers?: readonly IProvider[];
  /**
   * Imported modules whose exports become visible to this module.
   * @default Empty list when omitted.
   */
  readonly imports?: readonly IModuleReference[];
  /**
   * Own tokens or imported modules whose exports become visible to this module's importers.
   * @default Empty list when omitted.
   */
  readonly exports?: readonly IModuleExport[];
  /**
   * Makes this module's exports visible from every module in the container.
   * @default `false` when omitted.
   */
  readonly global?: boolean;
}
