import type { IMetadataReadAddress } from "../addressing/types/IMetadataReadAddress.js";
import type { IMetadataLookup } from "../addressing/types/IMetadataLookup.js";
import type { IDynamicClassMetadataAddress } from "../addressing/types/IDynamicClassMetadataAddress.js";
import type { IMetadataDefinitionsResult } from "./types/IMetadataDefinitionsResult.js";
import { MetadataDiscoveryOperations } from "./MetadataDiscoveryOperations.js";
/** Readonly frozen facade for discovering definition identities at metadata locations.
 * Calls inspect declarations, not names, instance state, or a global class registry.
 */
interface IMetadataDiscovery {
  /** Discovers identities at a checked location; class/inherited lookup is the default.
   * @template R Constructor or instance type used to check the address.
   * @param target Constructor or canonical instance alias to inspect.
   * @param address Optional checked address and lookup mode; omitted selects inherited class lookup.
   * @returns Frozen identity list in unspecified order, or typed target/address rejection.
   */
  readonly definitions: <R extends object>(
    target: R,
    address?: IMetadataReadAddress<NoInfer<R>> & IMetadataLookup,
  ) => IMetadataDefinitionsResult;
  /** Discovers identities at an erased location without finite-key or tuple guarantees.
   * Instance aliases reject static and constructor-parameter locations.
   * @param target Constructor or canonical instance alias to inspect.
   * @param address Optional dynamic address and lookup mode; omitted selects inherited class lookup.
   * @returns Frozen identity list in unspecified order, or typed target/address rejection.
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
