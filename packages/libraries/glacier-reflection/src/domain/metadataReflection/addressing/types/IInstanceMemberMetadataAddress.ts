/** Checked address for one key on an instance surface.
 * @template T Instance type whose keys constrain the member field.
 */
export interface IInstanceMemberMetadataAddress<T extends object> {
  /** Readonly discriminator identifying a member location, not class or parameter metadata. */
  readonly kind: "member";
  /** Readonly instance side; optional because instance is the default.
   * @default instance
   */
  readonly side?: "instance";
  /** Readonly property or method key belonging to the supplied instance type. */
  readonly member: keyof T;
}
