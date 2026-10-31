import type { IClassConstructor } from "../providers/IClassConstructor.js";
import type { IDynamicModule } from "./IDynamicModule.js";

/** A module as listed in `imports` or passed to the container: a decorated class or a dynamic module. */
export type IModuleReference = IClassConstructor | IDynamicModule;
