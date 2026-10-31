import { InvalidModuleError } from "../failures/InvalidModule.error.js";
import { MODULE_OPTIONS_METADATA } from "../metadata/ModuleOptionsMetadata.js";
import type { IClassConstructor } from "../providers/IClassConstructor.js";
import type { IModuleExport } from "./IModuleExport.js";
import type { IResolvedModule } from "./IResolvedModule.js";
import type { IModuleReference } from "./IModuleReference.js";

const DYNAMIC_PLACEHOLDER = Symbol("dynamic module");

/** Reads `@Module` metadata and merges it with dynamic-module data. */
export class ModuleMetadata {
  /**
   * Returns the module's metadata. A dynamic module's lists are appended to the static ones and its
   * `global` flag, when present, overrides the static flag.
   * Throws `InvalidModuleError` when the class is not decorated with `@Module`, a dynamic module has no
   * class, or a member has the wrong shape.
   */
  public static resolve(reference: IModuleReference): IResolvedModule {
    if (typeof reference === "function") return ModuleMetadata.#merge(reference, undefined);
    const dynamic: unknown = reference;
    if (typeof dynamic !== "object" || dynamic === null || !("module" in dynamic)) {
      throw new InvalidModuleError(
        DYNAMIC_PLACEHOLDER,
        "expected a class or a dynamic module with `module`",
      );
    }
    if (typeof dynamic.module !== "function") {
      throw new InvalidModuleError(
        DYNAMIC_PLACEHOLDER,
        "`module` of a dynamic module must be a class",
      );
    }
    return ModuleMetadata.#merge(dynamic.module as IClassConstructor, dynamic);
  }

  /** Combines the static declaration with the optional dynamic data. */
  static #merge(moduleClass: IClassConstructor, dynamic: object | undefined): IResolvedModule {
    const result = MODULE_OPTIONS_METADATA.read(moduleClass, {
      kind: "class",
      inheritance: "own",
    });
    if (!result.isValid || !result.isPresent) {
      throw new InvalidModuleError(moduleClass, "the class is not decorated with @Module");
    }
    const declared = result.value as object;
    const providers = ModuleMetadata.#readLists(moduleClass, declared, dynamic, "providers");
    const imports = ModuleMetadata.#readLists(moduleClass, declared, dynamic, "imports");
    const exports = ModuleMetadata.#readLists(moduleClass, declared, dynamic, "exports");
    const dynamicGlobal = ModuleMetadata.#readGlobal(moduleClass, dynamic);
    const staticGlobal = ModuleMetadata.#readGlobal(moduleClass, declared);
    return {
      moduleClass,
      providers,
      imports: imports as IModuleReference[],
      exports: exports as IModuleExport[],
      isGlobal: dynamicGlobal ?? staticGlobal ?? false,
    };
  }

  /** Concatenates the static and dynamic values of one list member. */
  static #readLists(
    moduleClass: IClassConstructor,
    declared: object,
    dynamic: object | undefined,
    key: string,
  ): unknown[] {
    return [
      ...ModuleMetadata.#readList(moduleClass, declared, key),
      ...ModuleMetadata.#readList(moduleClass, dynamic, key),
    ];
  }

  /** Reads an optional array member of untrusted module data. */
  static #readList(
    moduleClass: IClassConstructor,
    source: object | undefined,
    key: string,
  ): unknown[] {
    const value = source === undefined ? undefined : (source as Record<string, unknown>)[key];
    if (value === undefined) return [];
    if (!Array.isArray(value)) {
      throw new InvalidModuleError(moduleClass, `\`${key}\` must be an array`);
    }
    return value;
  }

  /** Reads the optional `global` flag of untrusted module data. */
  static #readGlobal(
    moduleClass: IClassConstructor,
    source: object | undefined,
  ): boolean | undefined {
    const value = source === undefined ? undefined : (source as Record<string, unknown>)["global"];
    if (value === undefined || typeof value === "boolean") return value;
    throw new InvalidModuleError(moduleClass, "`global` must be a boolean");
  }
}
