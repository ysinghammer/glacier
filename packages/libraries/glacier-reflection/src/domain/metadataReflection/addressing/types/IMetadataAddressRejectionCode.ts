/** Expected validation failures are not absence or unsuccessful deletion. */
export type IMetadataAddressRejectionCode =
  | "invalid-target"
  | "invalid-address"
  | "invalid-position"
  | "instance-address-not-supported";
