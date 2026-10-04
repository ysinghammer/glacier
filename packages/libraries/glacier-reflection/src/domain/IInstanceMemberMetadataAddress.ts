/** Checked instance-side member; side defaults to instance. */
export interface IInstanceMemberMetadataAddress<T extends object> {
  readonly kind: "member";
  readonly side?: "instance";
  readonly member: keyof T;
}
