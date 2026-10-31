import type { IClassConstructor } from "../../providers/types/IClassConstructor.js";
import type { IDynamicModule } from "./IDynamicModule.js";

/** Module reference accepted by imports and container creation: a decorated class or dynamic module. */
export type IModuleReference = IClassConstructor | IDynamicModule;
