import type { IClass } from "./IClass.js";

/** Legacy compiler callback whose invalid boundary inputs fail observably. */
export interface ICompilerMetadataDecorator {
  <C extends IClass>(target: C): void;
  (target: object, member: string | symbol, descriptor?: unknown): void;
}

declare global {
  namespace Reflect {
    /**
     * Installed automatically by a runtime root import before decorated declarations execute.
     * Accepts only design:type/design:paramtypes/design:returntype and checked runtime shapes.
     * Unsupported/malformed inputs throw MetadataBoundaryError before mutation; callbacks translate
     * invalid class/member locations to boundary errors. Not a general custom-metadata write API.
     */
    function metadata(key: unknown, value: unknown): ICompilerMetadataDecorator;
  }
}
