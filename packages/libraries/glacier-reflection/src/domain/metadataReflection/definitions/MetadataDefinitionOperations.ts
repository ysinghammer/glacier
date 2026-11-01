import type { IClass } from "../targets/types/IClass.js";
import type { IClassMetadataAddress } from "../addressing/types/IClassMetadataAddress.js";
import type { IDynamicClassMetadataAddress } from "../addressing/types/IDynamicClassMetadataAddress.js";
import type { IMetadataReadAddress } from "../addressing/types/IMetadataReadAddress.js";
import type { IMetadataLookup } from "../addressing/types/IMetadataLookup.js";
import type { IMetadataKind } from "./types/IMetadataKind.js";
import type { IMetadataDefinitionIdentity } from "./types/IMetadataDefinitionIdentity.js";
import type { IMetadataWriteResult } from "./types/IMetadataWriteResult.js";
import type { IMetadataRead } from "./types/IMetadataRead.js";
import type { IMetadataPresenceResult } from "./types/IMetadataPresenceResult.js";
import type { IMetadataDeletionResult } from "./types/IMetadataDeletionResult.js";
import type { IMetadataLocationsResult } from "../discovery/types/IMetadataLocationsResult.js";
import type { ILegacyMetadataDecorator } from "../decorators/ILegacyMetadataDecorator.js";
import { MetadataTarget } from "../targets/MetadataTarget.js";
import { MetadataAddress } from "../addressing/MetadataAddress.js";
import { MetadataStorage } from "../storage/MetadataStorage.js";
import { MetadataDecorator } from "../decorators/MetadataDecorator.js";
import { MetadataBoundaryError } from "../failures/MetadataBoundary.error.js";

/** Provides typed direct metadata operations over weak class-local storage.
 * Names are labels, values are trusted, omitted addresses mean class, and reads accept canonical instances.
 * @template TDeclaration Value accepted by writes and decorators.
 * @template TValue Prepared and returned storage value type.
 * @remarks Target/address inspection and snapshot failures from implementations remain observable.
 */
export abstract class MetadataDefinitionOperations<
  in out TDeclaration,
  in out TValue,
> implements IMetadataDefinitionIdentity {
  /** Readonly descriptive label that does not establish identity or register the definition. */
  public readonly name: string;
  /** Mutable weak class-local declaration store unique to this definition instance.
   * @default Fresh empty store per definition instance.
   */
  private storage = new MetadataStorage<TValue>();
  /** Readonly fixed resolution semantics reported during definition discovery. */
  public abstract readonly kind: IMetadataKind;
  /** Retains a label without registering or sharing definition identity.
   * @param name Descriptive name returned by discovery.
   */
  protected constructor(name: string) {
    this.name = name;
  }
  /** Converts one typed declaration into the value representation stored by this definition.
   * @param value Caller-supplied typed declaration.
   * @returns Prepared value to store and later resolve.
   */
  protected abstract prepare(value: TDeclaration): TValue;
  /** Returns the nearest present value, or valid absence when no values exist.
   * @param values Present values ordered nearest-first.
   * @returns Present nearest value or an absence result.
   */
  protected resolve(values: readonly TValue[]): IMetadataRead<TValue> {
    for (const value of values) {
      return { isValid: true, isPresent: true, value };
    }
    return { isValid: true, isPresent: false };
  }
  /** Replaces one direct constructor declaration after checked target/address validation.
   * Accumulating definitions snapshot outer containers; invalid inputs return without mutation.
   * @template C Constructor type used to constrain the checked address.
   * @param target Constructor owning the direct declaration.
   * @param value Typed declaration value prepared before storage.
   * @param address Optional checked class/member location; omitted means the class itself.
   * @returns Successful write or typed rejection; repeated writes replace, not accumulate.
   */
  public set<C extends IClass>(
    target: C,
    value: TDeclaration,
    address?: IClassMetadataAddress<NoInfer<C>>,
  ): IMetadataWriteResult {
    return this.setDynamic(target, value, address);
  }
  /** Replaces a constructor declaration using dynamic names while retaining value typing.
   * Validates address shape and positions, but not member existence or tuple bounds.
   * @param target Constructor owning the direct declaration; instances are rejected.
   * @param value Typed declaration value prepared before storage.
   * @param address Optional dynamic location; omitted means the class itself.
   * @returns Successful write or typed rejection; rejected inputs do not mutate storage.
   */
  public setDynamic(
    target: IClass,
    value: TDeclaration,
    address?: IDynamicClassMetadataAddress,
  ): IMetadataWriteResult {
    const normalizedTarget = MetadataTarget.normalize(target, true);
    if (!normalizedTarget.isValid) return normalizedTarget;
    const normalized = MetadataAddress.normalize(address, true, false);
    if (!normalized.isValid) return normalized;
    const prepared = this.prepare(value);
    this.storage.set(normalizedTarget.owner, this, normalized.address, prepared);
    return { isValid: true };
  }
  /** Reads the fixed value type through a constructor or canonical instance alias.
   * Inherited lookup is default; inspect isValid before isPresent because undefined may be present.
   * @template R Constructor or instance type used to check the address.
   * @param target Constructor or ordinary instance alias to read from.
   * @param address Optional checked location and lookup mode; omitted selects inherited class lookup.
   * @returns Typed value, valid absence, or typed target/address rejection.
   */
  public read<R extends object>(
    target: R,
    address?: IMetadataReadAddress<NoInfer<R>> & IMetadataLookup,
  ): IMetadataRead<TValue> {
    return this.readDynamic(target, address);
  }
  /** Reads a dynamic location with the same validation and inheritance as checked reads.
   * Dynamic addresses promise no finite keys, tuple bounds, or signature equivalence.
   * @param target Constructor or canonical instance alias to read from.
   * @param address Optional erased location and lookup mode; omitted selects inherited class lookup.
   * @returns Typed value, valid absence, or typed target/address rejection.
   */
  public readDynamic(
    target: object,
    address?: IDynamicClassMetadataAddress & IMetadataLookup,
  ): IMetadataRead<TValue> {
    const normalizedTarget = MetadataTarget.normalize(target, false);
    if (!normalizedTarget.isValid) return normalizedTarget;
    const normalized = MetadataAddress.normalize(address, false, normalizedTarget.isInstance);
    if (!normalized.isValid) return normalized;
    return this.resolve(
      this.storage.contributions(
        normalizedTarget.owner,
        normalized.address,
        normalized.inheritance,
        this.kind === "value",
      ),
    );
  }
  /** Checks whether a checked location has a declaration in inherited or own mode.
   * Undefined and empty accumulating declarations count as present; rejection is not absence.
   * @template R Constructor or instance type used to check the address.
   * @param target Constructor or ordinary instance alias to inspect.
   * @param address Optional checked location and lookup mode; omitted selects inherited class lookup.
   * @returns Presence, or a typed rejection for invalid target/address input.
   */
  public has<R extends object>(
    target: R,
    address?: IMetadataReadAddress<NoInfer<R>> & IMetadataLookup,
  ): IMetadataPresenceResult {
    return this.hasDynamic(target, address);
  }
  /** Checks presence at a dynamic location under runtime target/address restrictions.
   * Invalid input returns rejection; this method adds no exception handling for inspection failures.
   * @param target Constructor or canonical instance alias to inspect.
   * @param address Optional erased location and lookup mode; omitted selects inherited class lookup.
   * @returns Presence, or a typed rejection for invalid target/address input.
   */
  public hasDynamic(
    target: object,
    address?: IDynamicClassMetadataAddress & IMetadataLookup,
  ): IMetadataPresenceResult {
    const result = this.readDynamic(target, address);
    if (!result.isValid) return result;
    return { isValid: true, isPresent: result.isPresent };
  }
  /** Deletes only this definition's direct declaration from a constructor.
   * Removing it may reveal inherited metadata; instances are rejected.
   * @template C Constructor type used to constrain the checked address.
   * @param target Constructor owning the direct declaration.
   * @param address Optional checked location; omitted means the class itself.
   * @returns Successful deletion status, or typed rejection; false means no direct entry existed.
   */
  public delete<C extends IClass>(
    target: C,
    address?: IClassMetadataAddress<NoInfer<C>>,
  ): IMetadataDeletionResult {
    return this.deleteDynamic(target, address);
  }
  /** Deletes a dynamic direct constructor location without key or tuple-bound guarantees.
   * Rejected inputs leave declarations unchanged; deletion cannot reset or suppress inheritance.
   * @param target Constructor owning the direct declaration; instances are rejected.
   * @param address Optional erased location; omitted means the class itself.
   * @returns Successful deletion status, or typed rejection; false means no direct entry existed.
   */
  public deleteDynamic(
    target: IClass,
    address?: IDynamicClassMetadataAddress,
  ): IMetadataDeletionResult {
    const normalizedTarget = MetadataTarget.normalize(target, true);
    if (!normalizedTarget.isValid) return normalizedTarget;
    const normalized = MetadataAddress.normalize(address, true, false);
    if (!normalized.isValid) return normalized;
    return {
      isValid: true,
      isDeleted: this.storage.delete(normalizedTarget.owner, this, normalized.address),
    };
  }
  /** Discovers distinct metadata-bearing addresses, not all runtime members or parameters.
   * Results are shallow-frozen and unordered; instance aliases omit static and constructor locations.
   * @param target Constructor or canonical instance alias to inspect.
   * @param lookup Optional own/inherited mode; omitted includes ancestor declarations.
   * @returns Frozen discovered addresses, or a typed target/lookup rejection.
   */
  public locations(target: object, lookup?: IMetadataLookup): IMetadataLocationsResult {
    const normalizedTarget = MetadataTarget.normalize(target, false);
    if (!normalizedTarget.isValid) return normalizedTarget;
    const normalizedLookup = MetadataAddress.lookup(lookup);
    if (!normalizedLookup.isValid) return normalizedLookup;
    return {
      isValid: true,
      addresses: this.storage.locations(
        normalizedTarget.owner,
        normalizedLookup.mode,
        normalizedTarget.isInstance,
      ),
    };
  }
  /** Creates a legacy callback for writing one direct class, member, or parameter declaration.
   * Accumulating containers snapshot when created; callback behavior follows its declared contract.
   * @param value Typed declaration value prepared when the decorator is created.
   * @returns Legacy callback; its invocation contract documents boundary errors on the callback type.
   */
  public decorator(value: TDeclaration): ILegacyMetadataDecorator {
    const prepared = this.prepare(value);
    return (...arguments_: unknown[]): void => {
      const { owner, address } = MetadataDecorator.normalize(arguments_);
      const normalized = MetadataAddress.normalize(address, true, false);
      if (!normalized.isValid) throw new MetadataBoundaryError("invalid-decorator-location");
      this.storage.set(owner, this, normalized.address, prepared);
    };
  }
}
