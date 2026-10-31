import type { IClassConstructor } from "../providers/IClassConstructor.js";
import type { IModuleExport } from "./IModuleExport.js";
import type { IModuleReference } from "./IModuleReference.js";

/** The merged `@Module` and dynamic-module metadata of one module, with every member present. */
export interface IResolvedModule {
  /** The decorated module class. */
  readonly moduleClass: IClassConstructor;
  /** Providers as declared; shapes are validated when they are registered. */
  readonly providers: readonly unknown[];
  /** Imported modules, static metadata first. */
  readonly imports: readonly IModuleReference[];
  /** Exported tokens and re-exported modules, static metadata first. */
  readonly exports: readonly IModuleExport[];
  /** Whether the module's exports are visible container-wide. */
  readonly isGlobal: boolean;
}
