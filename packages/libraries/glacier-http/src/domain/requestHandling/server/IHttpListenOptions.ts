/** Native host semantics when omitted; port zero selects an ephemeral port. */
export interface IHttpListenOptions {
  /** Optional bind host; omission uses the native server host semantics. */
  readonly host?: string;
  /** TCP port from 0 through 65535; zero requests an ephemeral port. */
  readonly port: number;
}
