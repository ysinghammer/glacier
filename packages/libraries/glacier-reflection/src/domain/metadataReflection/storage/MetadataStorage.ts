import type { IClass } from "../targets/types/IClass.js";
import type { IDiscoveredMetadataAddress } from "../addressing/types/IDiscoveredMetadataAddress.js";
import type { IMetadataDefinitionIdentity } from "../definitions/types/IMetadataDefinitionIdentity.js";
import type { IMetadataRead } from "../definitions/types/IMetadataRead.js";
import { MetadataAddress } from "../addressing/MetadataAddress.js";
import { MetadataTarget } from "../targets/MetadataTarget.js";

/** Stores typed declarations by weak class owner and tracks discoverable identity/address pairs.
 * @template T Stored value type, including undefined when it is a valid present value.
 */
export class MetadataStorage<T> {
  /** Mutable weak index of definition identities and direct addresses for each class.
   * @default Empty weak map shared by this storage class.
   */
  private static index = new WeakMap<
    IClass,
    Map<IMetadataDefinitionIdentity, readonly IDiscoveredMetadataAddress[]>
  >();
  /** Mutable weak direct declarations keyed by canonical address without retaining class owners.
   * @default Empty weak map per storage instance.
   */
  private declarations = new WeakMap<IClass, Map<IDiscoveredMetadataAddress, T>>();

  /** Replaces one complete direct declaration after address normalization.
   * @param owner Constructor that owns the declaration.
   * @param identity Definition identity used to group locations for discovery.
   * @param address Canonical location to replace.
   * @param value Prepared value to retain at that location.
   * @returns No value; updates the owner declaration and discovery index.
   */
  public set(
    owner: IClass,
    identity: IMetadataDefinitionIdentity,
    address: IDiscoveredMetadataAddress,
    value: T,
  ): void {
    let declarations = this.declarations.get(owner);
    if (declarations === undefined) {
      declarations = new Map();
      this.declarations.set(owner, declarations);
    }
    const existing = this.find(declarations, address);
    declarations.set(existing ?? address, value);
    let index = MetadataStorage.index.get(owner);
    if (index === undefined) {
      index = new Map();
      MetadataStorage.index.set(owner, index);
    }
    index.set(identity, [...declarations.keys()]);
  }

  /** Reads the nearest declaration, distinguishing present undefined from absence.
   * @param owner Class from which lookup begins.
   * @param address Canonical metadata location to read.
   * @param inheritance Whether lookup checks only owner or walks its ancestors.
   * @returns A present value from the nearest declaration, or a valid absence result.
   */
  public read(
    owner: IClass,
    address: IDiscoveredMetadataAddress,
    inheritance: "own" | "inherited",
  ): IMetadataRead<T> {
    for (const current of MetadataTarget.owners(owner, inheritance)) {
      const declarations = this.declarations.get(current);
      if (declarations === undefined) continue;
      for (const [storedAddress, value] of declarations) {
        if (MetadataAddress.equals(storedAddress, address)) {
          return { isValid: true, isPresent: true, value };
        }
      }
    }
    return { isValid: true, isPresent: false };
  }

  /** Collects present contributions nearest-first, optionally stopping at the first one.
   * @param owner Class from which lookup begins.
   * @param address Canonical metadata location to read.
   * @param inheritance Whether lookup checks only owner or walks its ancestors.
   * @param isReplacement Stop after the nearest value for whole-value definitions.
   * @returns Present values in nearest-first order; an empty array means no declaration.
   */
  public contributions(
    owner: IClass,
    address: IDiscoveredMetadataAddress,
    inheritance: "own" | "inherited",
    isReplacement: boolean,
  ): readonly T[] {
    const values: T[] = [];
    for (const current of MetadataTarget.owners(owner, inheritance)) {
      const result = this.read(current, address, "own");
      if (result.isValid && result.isPresent) {
        values.push(result.value);
        if (isReplacement) break;
      }
    }
    return values;
  }

  /** Removes one direct entry and updates or clears its discovery index.
   * @param owner Class whose direct declaration is targeted.
   * @param identity Definition identity indexed for the location.
   * @param address Canonical location to remove.
   * @returns True when an entry was removed; inherited entries are never removed.
   */
  public delete(
    owner: IClass,
    identity: IMetadataDefinitionIdentity,
    address: IDiscoveredMetadataAddress,
  ): boolean {
    const declarations = this.declarations.get(owner);
    if (declarations === undefined) return false;
    const existing = this.find(declarations, address);
    if (existing === undefined) return false;
    declarations.delete(existing);
    const index = MetadataStorage.index.get(owner);
    if (declarations.size === 0) {
      this.declarations.delete(owner);
      index?.delete(identity);
      if (index?.size === 0) MetadataStorage.index.delete(owner);
    } else {
      index?.set(identity, [...declarations.keys()]);
    }
    return true;
  }

  /** Returns frozen canonical address snapshots, optionally filtering instance aliases.
   * @param owner Class from which location discovery begins.
   * @param inheritance Whether to include ancestor declarations.
   * @param isInstance Exclude static and constructor-parameter locations for instance aliases.
   * @returns Distinct detached addresses in unspecified order.
   */
  public locations(
    owner: IClass,
    inheritance: "own" | "inherited",
    isInstance: boolean,
  ): readonly IDiscoveredMetadataAddress[] {
    const addresses: IDiscoveredMetadataAddress[] = [];
    for (const current of MetadataTarget.owners(owner, inheritance)) {
      const declarations = this.declarations.get(current);
      if (declarations === undefined) continue;
      for (const address of declarations.keys()) {
        if (isInstance && !MetadataAddress.supportsInstance(address)) continue;
        if (!addresses.some((existing) => MetadataAddress.equals(existing, address))) {
          addresses.push(Object.freeze({ ...address }));
        }
      }
    }
    return Object.freeze(addresses);
  }

  /** Returns identities with declarations at one canonical location.
   * @param owner Class from which identity discovery begins.
   * @param address Canonical location to match.
   * @param inheritance Whether to include ancestor declarations.
   * @returns Distinct definition identities in an immutable array, without ordering guarantees.
   */
  public static definitions(
    owner: IClass,
    address: IDiscoveredMetadataAddress,
    inheritance: "own" | "inherited",
  ): readonly IMetadataDefinitionIdentity[] {
    const definitions = new Set<IMetadataDefinitionIdentity>();
    for (const current of MetadataTarget.owners(owner, inheritance)) {
      const index = MetadataStorage.index.get(current);
      if (index === undefined) continue;
      for (const [identity, addresses] of index) {
        if (addresses.some((existing) => MetadataAddress.equals(existing, address))) {
          definitions.add(identity);
        }
      }
    }
    return Object.freeze([...definitions]);
  }

  /** Finds the stored key equivalent to a canonical address.
   * @param declarations Direct declaration map to inspect.
   * @param address Canonical location whose matching key is sought.
   * @returns Existing key identity, or undefined when no equivalent location exists.
   */
  private find(
    declarations: Map<IDiscoveredMetadataAddress, T>,
    address: IDiscoveredMetadataAddress,
  ): IDiscoveredMetadataAddress | undefined {
    for (const existing of declarations.keys()) {
      if (MetadataAddress.equals(existing, address)) return existing;
    }
    return undefined;
  }
}
