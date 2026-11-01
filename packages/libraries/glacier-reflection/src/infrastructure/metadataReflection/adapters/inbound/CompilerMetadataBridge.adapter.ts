import type { ICompilerMetadataDecorator } from "../../../../domain/metadataReflection/compilerMetadata/types/ICompilerMetadataDecorator.js";
import { MetadataBoundaryError } from "../../../../domain/metadataReflection/failures/MetadataBoundary.error.js";
import { CompilerMetadataRecorder } from "./CompilerMetadataRecorder.adapter.js";

/** Installs the compiler's legacy metadata decorator protocol when explicitly activated by the register entry. */
export class CompilerMetadataBridge {
  /** Installs this module copy's metadata handler without changing other Reflect operations.
   * @returns No value; installs a writable, configurable, non-enumerable handler.
   * @throws {MetadataBoundaryError} If global Reflect cannot be read or is not an object.
   * @throws {MetadataBoundaryError} If metadata has an accessor or non-undefined value.
   * @throws {MetadataBoundaryError} If handler inspection or installation fails.
   * @remarks An absent property or data property valued undefined passes the ownership check.
   */
  public static activate(): void {
    let reflectObject: unknown;
    try {
      reflectObject = globalThis.Reflect;
    } catch (cause) {
      throw new MetadataBoundaryError("reflect-unavailable", { cause });
    }
    if (reflectObject === null || typeof reflectObject !== "object") {
      throw new MetadataBoundaryError("reflect-unavailable");
    }
    try {
      const descriptor = Object.getOwnPropertyDescriptor(reflectObject, "metadata");
      if (
        descriptor !== undefined &&
        (!("value" in descriptor) || descriptor.value !== undefined)
      ) {
        throw new MetadataBoundaryError("foreign-handler");
      }
      Object.defineProperty(reflectObject, "metadata", {
        value: this.metadata,
        writable: true,
        configurable: true,
        enumerable: false,
      });
    } catch (cause) {
      if (cause instanceof MetadataBoundaryError) throw cause;
      throw new MetadataBoundaryError("installation-failed", { cause });
    }
  }

  /**
   * Prepares supported compiler metadata and returns a decorator that records it on a declaration.
   * @param key Compiler metadata key; only the three design metadata keys are supported.
   * @param value Function/undefined type, or a dense array of those for design:paramtypes.
   * @returns A decorator that records the prepared value on a class or member.
   * @throws {MetadataBoundaryError} If preparation rejects input or throws during validation.
   * @see ICompilerMetadataDecorator
   */
  private static metadata(key: unknown, value: unknown): ICompilerMetadataDecorator {
    let declaration;
    try {
      declaration = CompilerMetadataRecorder.prepare(key, value);
    } catch (cause) {
      throw new MetadataBoundaryError("invalid-compiler-value", { cause });
    }
    if (!declaration.isValid) throw new MetadataBoundaryError(declaration.code);
    const prepared = declaration;
    return (...arguments_: readonly unknown[]): void => {
      let result;
      try {
        result = CompilerMetadataRecorder.record(prepared, arguments_);
      } catch (cause) {
        throw new MetadataBoundaryError("invalid-decorator-target", { cause });
      }
      if (!result.isValid) throw new MetadataBoundaryError(result.code);
    };
  }
}
