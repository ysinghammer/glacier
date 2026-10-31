import { InvalidModuleError } from "../errors/InvalidModule.error.js";
import { MODULE_OPTIONS_METADATA } from "../metadata/ModuleOptionsMetadata.js";
import type { IClassConstructor } from "../providers/types/IClassConstructor.js";
import type { IModuleExport } from "./types/IModuleExport.js";
import type { IResolvedModule } from "./types/IResolvedModule.js";
import type { IModuleReference } from "./types/IModuleReference.js";

const DYNAMIC_PLACEHOLDER = Symbol("dynamic module");

/** Reads and validates static module metadata, then merges any runtime module configuration. */
export class ModuleMetadata {
  /**
   * Resolves a decorated module and appends dynamic lists to static declarations.
   * @param reference Decorated module class or dynamic module configuration.
   * @returns Resolved module class, lists and effective global flag.
   * @throws {InvalidModuleError} If the reference is neither a class nor an object with `module`.
   * @throws {InvalidModuleError} If a dynamic reference has no class-valued `module` member.
   */
  public static resolve(reference: IModuleReference): IResolvedModule {
    if (typeof reference === "function") return ModuleMetadata.merge(reference, undefined);
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
    return ModuleMetadata.merge(dynamic.module as IClassConstructor, dynamic);
  }

  /** Combines own decorator metadata with optional dynamic configuration.
   * @param moduleClass Decorated module class to resolve.
   * @param dynamic Optional runtime configuration merged after static metadata.
   * @returns Complete resolved module declaration.
   * @throws {InvalidModuleError} If the class lacks valid own `@Module` metadata.
   */
  private static merge(
    moduleClass: IClassConstructor,
    dynamic: object | undefined,
  ): IResolvedModule {
    const result = MODULE_OPTIONS_METADATA.read(moduleClass, {
      kind: "class",
      inheritance: "own",
    });
    if (!result.isValid || !result.isPresent) {
      throw new InvalidModuleError(moduleClass, "the class is not decorated with @Module");
    }
    const declared = result.value as object;
    const providers = ModuleMetadata.readLists(moduleClass, declared, dynamic, "providers");
    const imports = ModuleMetadata.readLists(moduleClass, declared, dynamic, "imports");
    const exports = ModuleMetadata.readLists(moduleClass, declared, dynamic, "exports");
    const dynamicGlobal = ModuleMetadata.readGlobal(moduleClass, dynamic);
    const staticGlobal = ModuleMetadata.readGlobal(moduleClass, declared);
    return {
      moduleClass,
      providers,
      imports: imports as IModuleReference[],
      exports: exports as IModuleExport[],
      isGlobal: dynamicGlobal ?? staticGlobal ?? false,
    };
  }

  /** Concatenates one static option list followed by its dynamic additions.
   * @param moduleClass Module class used to identify invalid metadata.
   * @param declared Static decorator options.
   * @param dynamic Optional runtime options.
   * @param key Name of the list member to read.
   * @returns New list containing static entries before dynamic entries.
   */
  private static readLists(
    moduleClass: IClassConstructor,
    declared: object,
    dynamic: object | undefined,
    key: string,
  ): unknown[] {
    return [
      ...ModuleMetadata.readList(moduleClass, declared, key),
      ...ModuleMetadata.readList(moduleClass, dynamic, key),
    ];
  }

  /** Reads an optional array-valued option from untrusted module metadata.
   * @param moduleClass Module class used to identify invalid metadata.
   * @param source Options object to read, or `undefined` when absent.
   * @param key Member name to read.
   * @returns The array value, or an empty array when absent.
   * @throws {InvalidModuleError} If a present member is not an array.
   */
  private static readList(
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

  /** Reads the optional boolean global flag from untrusted module metadata.
   * @param moduleClass Module class used to identify invalid metadata.
   * @param source Options object to read, or `undefined` when absent.
   * @returns Boolean flag, or `undefined` when absent.
   * @throws {InvalidModuleError} If a present flag is not boolean.
   */
  private static readGlobal(
    moduleClass: IClassConstructor,
    source: object | undefined,
  ): boolean | undefined {
    const value = source === undefined ? undefined : (source as Record<string, unknown>)["global"];
    if (value === undefined || typeof value === "boolean") return value;
    throw new InvalidModuleError(moduleClass, "`global` must be a boolean");
  }
}
