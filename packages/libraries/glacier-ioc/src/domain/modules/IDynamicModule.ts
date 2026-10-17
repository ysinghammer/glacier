import type { IClassConstructor } from "../providers/IClassConstructor.js";
import type { IModuleOptions } from "./IModuleOptions.js";

/**
 * Module configuration produced at runtime (for example by `forRoot()`). Its members extend, never
 * replace, the metadata declared by `@Module` on `module`.
 */
export interface IDynamicModule extends IModuleOptions {
  /** The `@Module`-decorated class being configured. */
  readonly module: IClassConstructor;
}
