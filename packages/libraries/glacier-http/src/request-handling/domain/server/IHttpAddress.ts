/** Actual bound listener identity, detached from Node's mutable address records. */
export interface IHttpAddress {
  readonly host: string;
  readonly port: number;
}
