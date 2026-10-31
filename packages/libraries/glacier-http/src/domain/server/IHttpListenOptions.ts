/** Native host semantics when omitted; port zero selects an ephemeral port. */
export interface IHttpListenOptions {
  readonly host?: string;
  readonly port: number;
}
