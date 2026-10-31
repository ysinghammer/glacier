import type { IClass } from "../targets/types/IClass.js";
/** Legacy metadata callback forms supported by definition decorators.
 * Runtime invocation cannot prove source keys or parameter tuple bounds.
 */
export interface ILegacyMetadataDecorator {
  /** Applies a class decorator to its constructor.
   * @template C Constructor identity accepted by the class callback.
   * @param target Decorated constructor owning the class metadata.
   * @returns No value; the decorator records metadata without replacing the class.
   * @throws {MetadataBoundaryError} If the target is not a supported class.
   */
  <C extends IClass>(target: C): void;
  /** Applies metadata to a named instance or static member.
   * @param target Prototype for an instance member or constructor for a static member.
   * @param member String or symbol key of the decorated member.
   * @returns No value; the decorator records metadata without replacing the member.
   * @throws {MetadataBoundaryError} If the target or location is unsupported.
   */
  (target: object, member: string | symbol): void;
  /** Applies metadata to an accessor or method descriptor location.
   * @template T Descriptor value type supplied by TypeScript's legacy decorator typing.
   * @param target Prototype or constructor owning the member.
   * @param member String or symbol key of the decorated member.
   * @param descriptor Property descriptor supplied by the decorator runtime.
   * @returns No value; the decorator records metadata without replacing the descriptor.
   * @throws {MetadataBoundaryError} If the target or location is unsupported.
   */
  <T>(target: object, member: string | symbol, descriptor: TypedPropertyDescriptor<T>): void;
  /** Applies metadata to a constructor or method parameter position.
   * @param target Constructor for a constructor parameter, otherwise the member's prototype/constructor.
   * @param member Member key; undefined identifies a constructor parameter.
   * @param position Zero-based parameter position supplied by the runtime.
   * @returns No value; the decorator records metadata without replacing the declaration.
   * @throws {MetadataBoundaryError} If the target or location is unsupported.
   */
  (target: object, member: string | symbol | undefined, position: number): void;
}
