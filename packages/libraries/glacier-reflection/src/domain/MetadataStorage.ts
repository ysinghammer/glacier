import type { IClass } from "./IClass.js";
import type { IDiscoveredMetadataAddress } from "./IDiscoveredMetadataAddress.js";
import type { IMetadataDefinitionIdentity } from "./IMetadataDefinitionIdentity.js";
import type { IMetadataRead } from "./IMetadataRead.js";
import { MetadataAddress } from "./MetadataAddress.js";
import { MetadataTarget } from "./MetadataTarget.js";

/** Typed class-local declarations and a weak class-local identity/address index. */
export class MetadataStorage<T> {
  static #index = new WeakMap<
    IClass,
    Map<IMetadataDefinitionIdentity, readonly IDiscoveredMetadataAddress[]>
  >();
  #declarations = new WeakMap<IClass, Map<IDiscoveredMetadataAddress, T>>();

  /** Replaces one complete direct declaration after normalization has succeeded. */
  set(
    owner: IClass,
    identity: IMetadataDefinitionIdentity,
    address: IDiscoveredMetadataAddress,
    value: T,
  ): void {
    let declarations = this.#declarations.get(owner);
    if (declarations === undefined) {
      declarations = new Map();
      this.#declarations.set(owner, declarations);
    }
    const existing = this.#find(declarations, address);
    declarations.set(existing ?? address, value);
    let index = MetadataStorage.#index.get(owner);
    if (index === undefined) {
      index = new Map();
      MetadataStorage.#index.set(owner, index);
    }
    index.set(identity, [...declarations.keys()]);
  }

  /** Reads the nearest declaration, retaining presence independently from its value. */
  read(
    owner: IClass,
    address: IDiscoveredMetadataAddress,
    inheritance: "own" | "inherited",
  ): IMetadataRead<T> {
    for (const current of MetadataTarget.owners(owner, inheritance)) {
      const declarations = this.#declarations.get(current);
      if (declarations === undefined) continue;
      for (const [storedAddress, value] of declarations) {
        if (MetadataAddress.equals(storedAddress, address)) {
          return { isValid: true, isPresent: true, value };
        }
      }
    }
    return { isValid: true, isPresent: false };
  }

  /** Collects present contributions nearest-first without confusing undefined with absence. */
  contributions(
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

  /** Removes only a direct entry, cleaning the class-local discovery index. */
  delete(
    owner: IClass,
    identity: IMetadataDefinitionIdentity,
    address: IDiscoveredMetadataAddress,
  ): boolean {
    const declarations = this.#declarations.get(owner);
    if (declarations === undefined) return false;
    const existing = this.#find(declarations, address);
    if (existing === undefined) return false;
    declarations.delete(existing);
    const index = MetadataStorage.#index.get(owner);
    if (declarations.size === 0) {
      this.#declarations.delete(owner);
      index?.delete(identity);
      if (index?.size === 0) MetadataStorage.#index.delete(owner);
    } else {
      index?.set(identity, [...declarations.keys()]);
    }
    return true;
  }

  /** Returns frozen canonical address snapshots, optionally filtering instance aliases. */
  locations(
    owner: IClass,
    inheritance: "own" | "inherited",
    isInstance: boolean,
  ): readonly IDiscoveredMetadataAddress[] {
    const addresses: IDiscoveredMetadataAddress[] = [];
    for (const current of MetadataTarget.owners(owner, inheritance)) {
      const declarations = this.#declarations.get(current);
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

  /** Returns a frozen array of actual identities at an exact canonical location. */
  static definitions(
    owner: IClass,
    address: IDiscoveredMetadataAddress,
    inheritance: "own" | "inherited",
  ): readonly IMetadataDefinitionIdentity[] {
    const definitions = new Set<IMetadataDefinitionIdentity>();
    for (const current of MetadataTarget.owners(owner, inheritance)) {
      const index = MetadataStorage.#index.get(current);
      if (index === undefined) continue;
      for (const [identity, addresses] of index) {
        if (addresses.some((existing) => MetadataAddress.equals(existing, address))) {
          definitions.add(identity);
        }
      }
    }
    return Object.freeze([...definitions]);
  }

  /** Finds the existing key for an equivalent normalized caller address. */
  #find(
    declarations: Map<IDiscoveredMetadataAddress, T>,
    address: IDiscoveredMetadataAddress,
  ): IDiscoveredMetadataAddress | undefined {
    for (const existing of declarations.keys()) {
      if (MetadataAddress.equals(existing, address)) return existing;
    }
    return undefined;
  }
}
