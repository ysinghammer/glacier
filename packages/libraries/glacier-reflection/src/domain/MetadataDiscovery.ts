import type { IMetadataReadAddress } from "./IMetadataReadAddress.js";
import type { IMetadataLookup } from "./IMetadataLookup.js";
import type { IDynamicClassMetadataAddress } from "./IDynamicClassMetadataAddress.js";
import type { IMetadataDefinitionsResult } from "./IMetadataDefinitionsResult.js";
import { MetadataDiscoveryOperations } from "./MetadataDiscoveryOperations.js";
/**
 * Contract of the frozen, nonconstructible operation record; consumers use typeof MetadataDiscovery.
 * Readonly detached calls discover declaration identities, not names, instance state or a class registry.
 */
interface IMetadataDiscovery {
  /**
   * Discovers identities once each at one checked address, defaulting to class and inherited lookup.
   * Own mode restricts to direct declarations. Present undefined/empty collections remain discoverable.
   * Returns a shallow-frozen identity array without promised ordering, or a typed address rejection.
   */
  readonly definitions: <R extends object>(
    target: R,
    address?: IMetadataReadAddress<NoInfer<R>> & IMetadataLookup,
  ) => IMetadataDefinitionsResult;
  /**
   * Discovers identities at a dynamic address without finite-key or tuple guarantees.
   * Instance aliases permit only class and instance-side locations; static/constructor parameters reject.
   * Inspection exceptions propagate; no getters or consumer constructors are invoked.
   */
  readonly definitionsDynamic: (
    target: object,
    address?: IDynamicClassMetadataAddress & IMetadataLookup,
  ) => IMetadataDefinitionsResult;
}

const metadataDiscovery: IMetadataDiscovery = Object.freeze({
  definitions: MetadataDiscoveryOperations.definitions,
  definitionsDynamic: MetadataDiscoveryOperations.definitionsDynamic,
});

export { metadataDiscovery as MetadataDiscovery };
