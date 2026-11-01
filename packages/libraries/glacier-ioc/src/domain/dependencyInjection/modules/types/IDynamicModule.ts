import type { IClassConstructor } from "../../providers/types/IClassConstructor.js";
import type { IModuleOptions } from "./IModuleOptions.js";

/** Runtime module configuration that appends to, rather than replaces, its class's `@Module` metadata. */
export interface IDynamicModule extends IModuleOptions {
  /** Decorated module class whose metadata is extended by this configuration. */
  readonly module: IClassConstructor;
}
