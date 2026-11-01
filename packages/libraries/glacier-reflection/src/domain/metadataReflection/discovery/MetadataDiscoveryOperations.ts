import type { IMetadataReadAddress } from "../addressing/types/IMetadataReadAddress.js";
import type { IMetadataLookup } from "../addressing/types/IMetadataLookup.js";
import type { IDynamicClassMetadataAddress } from "../addressing/types/IDynamicClassMetadataAddress.js";
import type { IMetadataDefinitionsResult } from "./types/IMetadataDefinitionsResult.js";
import { MetadataTarget } from "../targets/MetadataTarget.js";
import { MetadataAddress } from "../addressing/MetadataAddress.js";
import { MetadataStorage } from "../storage/MetadataStorage.js";

/** Implements definition identity discovery for the frozen public facade. */
export class MetadataDiscoveryOperations {
  /** Discovers identities at a checked location; class/inherited lookup is the default.
   * @template R Constructor or instance type used to check the address.
   * @param target Constructor or canonical instance alias to inspect.
   * @param address Optional checked address and lookup mode; omitted selects inherited class lookup.
   * @returns Frozen identity list in unspecified order, or typed target/address rejection.
   */
  public static definitions<R extends object>(
    target: R,
    address?: IMetadataReadAddress<NoInfer<R>> & IMetadataLookup,
  ): IMetadataDefinitionsResult {
    return MetadataDiscoveryOperations.definitionsDynamic(target, address);
  }

  /** Discovers identities at an erased location without finite-key or tuple guarantees.
   * Instance aliases reject static and constructor-parameter locations.
   * @param target Constructor or canonical instance alias to inspect.
   * @param address Optional dynamic address and lookup mode; omitted selects inherited class lookup.
   * @returns Frozen identity list in unspecified order, or typed target/address rejection.
   */
  public static definitionsDynamic(
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
