import { MODULE_OPTIONS_METADATA } from "../metadata/ModuleOptionsMetadata.js";
import type { IModuleOptions } from "../modules/IModuleOptions.js";

/**
 * Class decorator declaring a module: its `providers`, `imports`, `exports` and whether it is `global`.
 * Records metadata only; the container reads and validates it in `GlacierContainer.create`.
 */
export function Module(options: IModuleOptions = {}): ClassDecorator {
  return MODULE_OPTIONS_METADATA.decorator(options);
}
