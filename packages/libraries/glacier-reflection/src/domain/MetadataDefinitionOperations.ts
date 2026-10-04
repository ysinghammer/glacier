import type { IClass } from "./IClass.js";
import type { IClassMetadataAddress } from "./IClassMetadataAddress.js";
import type { IDynamicClassMetadataAddress } from "./IDynamicClassMetadataAddress.js";
import type { IMetadataReadAddress } from "./IMetadataReadAddress.js";
import type { IMetadataLookup } from "./IMetadataLookup.js";
import type { IMetadataKind } from "./IMetadataKind.js";
import type { IMetadataDefinitionIdentity } from "./IMetadataDefinitionIdentity.js";
import type { IMetadataWriteResult } from "./IMetadataWriteResult.js";
import type { IMetadataRead } from "./IMetadataRead.js";
import type { IMetadataPresenceResult } from "./IMetadataPresenceResult.js";
import type { IMetadataDeletionResult } from "./IMetadataDeletionResult.js";
import type { IMetadataLocationsResult } from "./IMetadataLocationsResult.js";
import type { ILegacyMetadataDecorator } from "./ILegacyMetadataDecorator.js";
import { MetadataTarget } from "./MetadataTarget.js";
import { MetadataAddress } from "./MetadataAddress.js";
import { MetadataStorage } from "./MetadataStorage.js";
import { MetadataDecorator } from "./MetadataDecorator.js";
import { MetadataBoundaryError } from "./MetadataBoundary.error.js";

/**
 * Definition-owned direct operations over weak class-local storage.
 * Names never establish identity. Values are trusted typed inputs, not general JavaScript validation.
 * Omitted addresses select class declarations; member sides default to instance.
 * Read-side operations accept canonical instance aliases without inspecting instance values or getters.
 * Plain objects/prototypes reject; descriptor/proxy inspection exceptions remain observable.
 * This shared base is internal and is not exported through the package root.
 */
export abstract class MetadataDefinitionOperations<
  in out TDeclaration,
  in out TValue,
> implements IMetadataDefinitionIdentity {
  readonly name: string;
  #storage = new MetadataStorage<TValue>();
  abstract readonly kind: IMetadataKind;
  /** Retains a descriptive label without registering or sharing identities. */
  protected constructor(name: string) {
    this.name = name;
  }
  /** Converts the fixed declaration contract to this definition's stored value contract. */
  protected abstract prepare(value: TDeclaration): TValue;
  /** Resolves nearest-first declarations according to the fixed definition meaning. */
  protected resolve(values: readonly TValue[]): IMetadataRead<TValue> {
    for (const value of values) {
      return { isValid: true, isPresent: true, value };
    }
    return { isValid: true, isPresent: false };
  }
  /**
   * Replaces one direct declaration on a constructor; repeated writes do not accumulate.
   * Checks visible keys/fixed tuple positions against the target without widening it.
   * Returns a typed atomic rejection for invalid targets/addresses/positions.
   * Accumulating outer containers snapshot before storage; snapshot exceptions remain thrown.
   */
  set<C extends IClass>(
    target: C,
    value: TDeclaration,
    address?: IClassMetadataAddress<NoInfer<C>>,
  ): IMetadataWriteResult {
    return this.setDynamic(target, value, address);
  }
  /**
   * Replaces a constructor declaration using dynamic names/positions while retaining value typing.
   * Validates address shape and safe nonnegative integer positions, not member existence or tuple bounds.
   * Instances and inheritance options reject without mutation; inspection/snapshot exceptions propagate.
   */
  setDynamic(
    target: IClass,
    value: TDeclaration,
    address?: IDynamicClassMetadataAddress,
  ): IMetadataWriteResult {
    const normalizedTarget = MetadataTarget.normalize(target, true);
    if (!normalizedTarget.isValid) return normalizedTarget;
    const normalized = MetadataAddress.normalize(address, true, false);
    if (!normalized.isValid) return normalized;
    const prepared = this.prepare(value);
    this.#storage.set(normalizedTarget.owner, this, normalized.address, prepared);
    return { isValid: true };
  }
  /**
   * Reads the fixed value type through a constructor or class-instance alias.
   * Inherited lookup is default; address.inheritance "own" selects direct class declarations.
   * Validate isValid before isPresent: present undefined is distinct from absence.
   * Instance addresses exclude static members and individual constructor parameters.
   */
  read<R extends object>(
    target: R,
    address?: IMetadataReadAddress<NoInfer<R>> & IMetadataLookup,
  ): IMetadataRead<TValue> {
    return this.readDynamic(target, address);
  }
  /**
   * Reads dynamic/discovered locations with the same validation and inheritance as checked reads.
   * Makes no finite-key, tuple-bound or signature-equivalence guarantee; parameter inheritance is positional.
   * Instance static/constructor-parameter requests reject rather than appear absent.
   */
  readDynamic(
    target: object,
    address?: IDynamicClassMetadataAddress & IMetadataLookup,
  ): IMetadataRead<TValue> {
    const normalizedTarget = MetadataTarget.normalize(target, false);
    if (!normalizedTarget.isValid) return normalizedTarget;
    const normalized = MetadataAddress.normalize(address, false, normalizedTarget.isInstance);
    if (!normalized.isValid) return normalized;
    return this.resolve(
      this.#storage.contributions(
        normalizedTarget.owner,
        normalized.address,
        normalized.inheritance,
        this.kind === "value",
      ),
    );
  }
  /**
   * Checks validated presence at a checked location in inherited (default) or own mode.
   * Undefined and empty accumulating declarations count as present; invalid inputs are not absence.
   */
  has<R extends object>(
    target: R,
    address?: IMetadataReadAddress<NoInfer<R>> & IMetadataLookup,
  ): IMetadataPresenceResult {
    return this.hasDynamic(target, address);
  }
  /**
   * Checks presence at a dynamic location, retaining runtime target/address restrictions.
   * Invalid inputs return rejection; exceptional inspection failures remain thrown.
   */
  hasDynamic(
    target: object,
    address?: IDynamicClassMetadataAddress & IMetadataLookup,
  ): IMetadataPresenceResult {
    const result = this.readDynamic(target, address);
    if (!result.isValid) return result;
    return { isValid: true, isPresent: result.isPresent };
  }
  /**
   * Deletes only this definition's direct constructor declaration, never an ancestor.
   * Returns validated isDeleted; removal may reveal inherited metadata. Instances reject.
   */
  delete<C extends IClass>(
    target: C,
    address?: IClassMetadataAddress<NoInfer<C>>,
  ): IMetadataDeletionResult {
    return this.deleteDynamic(target, address);
  }
  /**
   * Deletes a dynamic constructor location without finite-key/tuple guarantees.
   * Rejected inputs leave declarations unchanged; no inheritance/reset/suppression option exists.
   */
  deleteDynamic(target: IClass, address?: IDynamicClassMetadataAddress): IMetadataDeletionResult {
    const normalizedTarget = MetadataTarget.normalize(target, true);
    if (!normalizedTarget.isValid) return normalizedTarget;
    const normalized = MetadataAddress.normalize(address, true, false);
    if (!normalized.isValid) return normalized;
    return {
      isValid: true,
      isDeleted: this.#storage.delete(normalizedTarget.owner, this, normalized.address),
    };
  }
  /**
   * Discovers distinct metadata-bearing addresses, not every runtime member or parameter.
   * Lookup defaults to inherited; own means direct declarations on the resolved class.
   * Instance aliases omit static and individual constructor-parameter locations.
   * Arrays/target-free canonical records are shallow-frozen with unspecified ordering.
   * Use readDynamic for returned records, explicitly carrying own mode into the read if needed.
   */
  locations(target: object, lookup?: IMetadataLookup): IMetadataLocationsResult {
    const normalizedTarget = MetadataTarget.normalize(target, false);
    if (!normalizedTarget.isValid) return normalizedTarget;
    const normalizedLookup = MetadataAddress.lookup(lookup);
    if (!normalizedLookup.isValid) return normalizedLookup;
    return {
      isValid: true,
      addresses: this.#storage.locations(
        normalizedTarget.owner,
        normalizedLookup.mode,
        normalizedTarget.isInstance,
      ),
    };
  }
  /**
   * Creates a typed legacy decorator for class/member/accessor/constructor or method parameter locations.
   * Snapshots accumulating outer containers now; replacement/contained values retain identity.
   * Invocation replaces the direct declaration and returns void without replacing consumers.
   * Legacy callback typing cannot prove source keys or tuple bounds; invalid invocation throws
   * MetadataBoundaryError and exceptional inspection/snapshot failures remain observable.
   */
  decorator(value: TDeclaration): ILegacyMetadataDecorator {
    const prepared = this.prepare(value);
    return (...arguments_: unknown[]): void => {
      const { owner, address } = MetadataDecorator.normalize(arguments_);
      const normalized = MetadataAddress.normalize(address, true, false);
      if (!normalized.isValid) throw new MetadataBoundaryError("invalid-decorator-location");
      this.#storage.set(owner, this, normalized.address, prepared);
    };
  }
}
