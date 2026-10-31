/** Actual bound listener identity, detached from Node's mutable address records. */
export interface IHttpAddress {
  /** Bound interface address as reported by the active listener. */
  readonly host: string;
  /** Actual bound TCP port, including the selected port when zero was requested. */
  readonly port: number;
}
