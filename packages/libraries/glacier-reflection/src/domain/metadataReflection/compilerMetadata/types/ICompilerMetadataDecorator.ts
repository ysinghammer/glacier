import type { IClass } from "../../targets/types/IClass.js";

/** Legacy callback forms returned by the explicitly registered compiler metadata handler.
 * @remarks Invalid target or location inputs fail with a boundary error.
 */
export interface ICompilerMetadataDecorator {
  /** Records prepared compiler metadata on a class declaration.
   * @template C Constructor identity accepted by the class callback.
   * @param target Decorated class constructor.
   * @returns No value; records metadata without replacing the class.
   * @throws {MetadataBoundaryError} If recording rejects the target or its metadata location.
   */
  <C extends IClass>(target: C): void;
  /** Records prepared compiler metadata on a member declaration.
   * @param target Prototype for an instance member or constructor for a static member.
   * @param member String or symbol key of the decorated member.
   * @param descriptor Optional legacy property descriptor; it is not used as metadata.
   * @returns No value; records metadata without replacing the member.
   * @throws {MetadataBoundaryError} If recording rejects the target or its metadata location.
   */
  (target: object, member: string | symbol, descriptor?: unknown): void;
}

declare global {
  namespace Reflect {
    /** Prepares metadata from a supported legacy TypeScript design key.
     * @param key One of `design:type`, `design:paramtypes`, or `design:returntype`.
     * @param value Function/undefined representation, or a dense array for `design:paramtypes`.
     * @returns Decorator callback that records the prepared value on a class or member.
     * @throws {MetadataBoundaryError} If key is unsupported or value fails compiler validation.
     * @remarks Import `@glacier/reflection/register` first; missed emissions cannot be recovered.
     */
    function metadata(key: unknown, value: unknown): ICompilerMetadataDecorator;
  }
}
