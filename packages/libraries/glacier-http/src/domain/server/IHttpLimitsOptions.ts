/** Finite body receive limits; the remaining lifecycle/normalization options arrive in phase 06. */
export interface IHttpLimitsOptions {
  readonly bodyBytes?: number;
  readonly requestTimeoutMs?: number;
}
