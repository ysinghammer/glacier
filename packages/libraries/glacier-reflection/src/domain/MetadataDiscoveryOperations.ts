import type { IMetadataReadAddress } from "./IMetadataReadAddress.js";
import type { IMetadataLookup } from "./IMetadataLookup.js";
import type { IDynamicClassMetadataAddress } from "./IDynamicClassMetadataAddress.js";
import type { IMetadataDefinitionsResult } from "./IMetadataDefinitionsResult.js";
import { MetadataTarget } from "./MetadataTarget.js";
import { MetadataAddress } from "./MetadataAddress.js";
import { MetadataStorage } from "./MetadataStorage.js";

/** Internal class-backed discovery for the frozen facade; no public construction or instance API. */
export class MetadataDiscoveryOperations {
  /**
   * Discovers identities once each at a checked address, defaulting to class and inherited lookup.
   * Own mode restricts to direct declarations; present undefined/empty collections remain discoverable.
   * Returns a shallow-frozen identity array or a typed address rejection, without ordering promises.
   */
  static definitions<R extends object>(
    target: R,
    address?: IMetadataReadAddress<NoInfer<R>> & IMetadataLookup,
  ): IMetadataDefinitionsResult {
    return MetadataDiscoveryOperations.definitionsDynamic(target, address);
  }

  /**
   * Discovers identities at a dynamic address without finite-key or tuple guarantees.
   * Instance aliases permit only class and instance-side locations; static/constructor parameters reject.
   * Inspection exceptions propagate; no getters or consumer constructors are invoked.
   */
  static definitionsDynamic(
    target: object,
    address?: IDynamicClassMetadataAddress & IMetadataLookup,
  ): IMetadataDefinitionsResult {
    const normalizedTarget = MetadataTarget.normalize(target, false);
    if (!normalizedTarget.isValid) return normalizedTarget;
    const normalized = MetadataAddress.normalize(address, false, normalizedTarget.isInstance);
    if (!normalized.isValid) return normalized;
    return {
      isValid: true,
      definitions: MetadataStorage.definitions(
        normalizedTarget.owner,
        normalized.address,
        normalized.inheritance,
      ),
    };
  }
}
