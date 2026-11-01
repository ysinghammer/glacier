import type { IClass } from "./types/IClass.js";
import type { IMetadataAddressRejection } from "../addressing/types/IMetadataAddressRejection.js";

/** A validated class owner and alias mode produced from a constructor or canonical instance.
 * @property isValid Readonly success discriminator for the resolved target.
 * @property owner Readonly constructor that owns all associated storage.
 * @property isInstance Readonly true for an instance alias, false for a constructor.
 */
interface IMetadataTarget {
  readonly isValid: true;
  readonly owner: IClass;
  readonly isInstance: boolean;
}

/** Validates constructor and instance targets without invoking consumer methods or accessors. */
export class MetadataTarget {
  /** Resolves constructors or, on read paths only, ordinary instance prototypes.
   * @param target Untrusted constructor or possible instance value.
   * @param isMutation True for write/delete paths, which accept constructors only.
   * @returns Resolved owner and alias mode, or a typed target rejection.
   * @remarks Proxy traps during descriptor/prototype inspection may run and their failures propagate.
   */
  public static normalize(
    target: unknown,
    isMutation: boolean,
  ): IMetadataTarget | IMetadataAddressRejection {
    if (MetadataTarget.isClass(target)) {
      return { isValid: true, owner: target, isInstance: false };
    }
    if (isMutation || typeof target !== "object" || target === null) {
      return { isValid: false, code: "invalid-target" };
    }
    if (MetadataTarget.classOfPrototype(target) !== undefined) {
      return { isValid: false, code: "invalid-target" };
    }
    let prototype: unknown = Object.getPrototypeOf(target);
    while (typeof prototype === "object" && prototype !== null && prototype !== Object.prototype) {
      const owner = MetadataTarget.classOfPrototype(prototype);
      if (owner !== undefined) {
        return { isValid: true, owner, isInstance: true };
      }
      prototype = Object.getPrototypeOf(prototype);
    }
    return { isValid: false, code: "invalid-target" };
  }

  /** Checks constructability and matching own data descriptors without calling the target.
   * @param target Untrusted value to test as a class constructor.
   * @returns True for a constructable function with matching prototype constructor descriptors.
   */
  public static isClass(target: unknown): target is IClass {
    if (typeof target !== "function") return false;
    const prototype: unknown = Object.getOwnPropertyDescriptor(target, "prototype")?.value;
    if (typeof prototype !== "object" || prototype === null) return false;
    const constructor: unknown = Object.getOwnPropertyDescriptor(prototype, "constructor")?.value;
    if (constructor !== target) return false;

    // The trap runs only for constructable targets and does not inspect their prototype or body.
    const probe = new Proxy(target, { construct: () => ({}) });
    try {
      Reflect.construct(probe, []);
      return true;
    } catch {
      // Only the intrinsic nonconstructable-target rejection can occur: the owned trap returns an object.
      return false;
    }
  }

  /** Finds an own constructor descriptor whose canonical prototype is this object.
   * @param prototype Prototype object whose owning class is sought.
   * @returns Matching constructor, or undefined when it is not a canonical class prototype.
   */
  public static classOfPrototype(prototype: object): IClass | undefined {
    const constructor: unknown = Object.getOwnPropertyDescriptor(prototype, "constructor")?.value;
    if (!MetadataTarget.isClass(constructor)) return undefined;
    const canonical: unknown = Object.getOwnPropertyDescriptor(constructor, "prototype")?.value;
    return canonical === prototype ? constructor : undefined;
  }

  /** Iterates a class and optionally its constructor ancestry, nearest first.
   * @param owner Starting constructor included as the first result.
   * @param inheritance Own stops after owner; inherited follows constructable ancestors.
   * @returns Iterable sequence of class owners in lookup order.
   */
  public static *owners(owner: IClass, inheritance: "own" | "inherited"): Iterable<IClass> {
    yield owner;
    if (inheritance === "own") return;
    let ancestor: unknown = Object.getPrototypeOf(owner);
    while (MetadataTarget.isClass(ancestor)) {
      yield ancestor;
      ancestor = Object.getPrototypeOf(ancestor);
    }
  }
}
