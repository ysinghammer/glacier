import type { IProvider } from "../providers/IProvider.js";
import type { IModuleExport } from "./IModuleExport.js";
import type { IModuleReference } from "./IModuleReference.js";

/** Metadata accepted by `@Module` and, extended, by dynamic modules; every member is optional. */
export interface IModuleOptions {
  /** Providers owned by the module; they are private unless exported. */
  readonly providers?: readonly IProvider[];
  /** Modules whose exports become visible inside this module. */
  readonly imports?: readonly IModuleReference[];
  /** Own provider tokens, imported provider tokens or imported modules made visible to importers. */
  readonly exports?: readonly IModuleExport[];
  /** When true, this module's exports are visible in every module of the container. */
  readonly global?: boolean;
}
