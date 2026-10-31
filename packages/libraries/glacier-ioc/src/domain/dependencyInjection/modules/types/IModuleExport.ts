import type { ITokenReference } from "../../tokens/types/ITokenReference.js";
import type { IModuleReference } from "./IModuleReference.js";

/** Export entry that exposes a provider token or forwards an imported module's exports. */
export type IModuleExport = ITokenReference | IModuleReference;
