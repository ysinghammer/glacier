import type { ITokenReference } from "../tokens/ITokenReference.js";
import type { IModuleReference } from "./IModuleReference.js";

/**
 * One entry of a module's `exports`: a provider token made visible to importers, or an imported module
 * whose own exports are re-exported.
 */
export type IModuleExport = ITokenReference | IModuleReference;
