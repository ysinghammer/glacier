import type { ICompilerMetadataDecorator } from "../../../domain/ICompilerMetadataDecorator.js";
import { MetadataBoundaryError } from "../../../domain/MetadataBoundary.error.js";
import { CompilerMetadataRecorder } from "./CompilerMetadataRecorder.adapter.js";

/** Installs only the legacy compiler protocol; evaluated physical copies never share activation. */
export class CompilerMetadataBridge {
  /** Fails without touching occupied descriptors or unrelated Reflect operations. */
  static activate(): void {
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

  /** Rejects keys/shapes immediately; legacy callbacks translate invalid addresses into safe errors. */
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
