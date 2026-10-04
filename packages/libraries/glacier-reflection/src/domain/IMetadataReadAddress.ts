import type { IClass } from "./IClass.js";
import type { IClassMetadataAddress } from "./IClassMetadataAddress.js";
import type { IInstanceMetadataAddress } from "./IInstanceMetadataAddress.js";
/** Checked read-side address anchored to the supplied constructor or instance. */
export type IMetadataReadAddress<R extends object> = R extends IClass
  ? IClassMetadataAddress<R>
  : IInstanceMetadataAddress<R>;
