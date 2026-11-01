import type { IClassConstructor } from "../../providers/types/IClassConstructor.js";
import type { IModuleExport } from "./IModuleExport.js";
import type { IModuleReference } from "./IModuleReference.js";

/** Complete module declaration after static and dynamic metadata have been merged. */
export interface IResolvedModule {
  /** Decorated class that declares this module. */
  readonly moduleClass: IClassConstructor;
  /** Raw provider declarations; normalization happens during graph registration. */
  readonly providers: readonly unknown[];
  /** Imported module references, with static entries before dynamic additions. */
  readonly imports: readonly IModuleReference[];
  /** Export entries, with static entries before dynamic additions. */
  readonly exports: readonly IModuleExport[];
  /** Whether exports are visible throughout the container. */
  readonly isGlobal: boolean;
}
