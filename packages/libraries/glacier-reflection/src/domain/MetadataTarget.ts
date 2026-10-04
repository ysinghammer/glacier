import type { IClass } from "./IClass.js";
import type { IMetadataAddressRejection } from "./IMetadataAddressRejection.js";

/** A validated class owner; instances are aliases and never storage keys. */
interface IMetadataTarget {
  readonly isValid: true;
  readonly owner: IClass;
  readonly isInstance: boolean;
}

/** Inspects canonical class descriptors without invoking consumer code. */
export class MetadataTarget {
  /** Resolves constructors or, on read paths only, ordinary instance prototypes. */
  static normalize(
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

  /** Checks constructability and matching own data descriptors, without calling the target. */
  static isClass(target: unknown): target is IClass {
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

  /** Finds an own constructor data descriptor whose prototype is exactly this object. */
  static classOfPrototype(prototype: object): IClass | undefined {
    const constructor: unknown = Object.getOwnPropertyDescriptor(prototype, "constructor")?.value;
    if (!MetadataTarget.isClass(constructor)) return undefined;
    const canonical: unknown = Object.getOwnPropertyDescriptor(constructor, "prototype")?.value;
    return canonical === prototype ? constructor : undefined;
  }

  /** Enumerates class ancestry only; own-only queries never inspect ancestors. */
  static *owners(owner: IClass, inheritance: "own" | "inherited"): Iterable<IClass> {
    yield owner;
    if (inheritance === "own") return;
    let ancestor: unknown = Object.getPrototypeOf(owner);
    while (MetadataTarget.isClass(ancestor)) {
      yield ancestor;
      ancestor = Object.getPrototypeOf(ancestor);
    }
  }
}
