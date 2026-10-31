import { MODULE_OPTIONS_METADATA } from "../metadata/ModuleOptionsMetadata.js";
import type { IModuleOptions } from "../modules/types/IModuleOptions.js";

/**
 * Declares module providers, imports, exports and global visibility for later container validation.
 * @param options Module declaration; omitted options records an empty module configuration.
 * @returns A class decorator that stores the declaration without creating providers.
 */
export function Module(options: IModuleOptions = {}): ClassDecorator {
  return MODULE_OPTIONS_METADATA.decorator(options);
}
