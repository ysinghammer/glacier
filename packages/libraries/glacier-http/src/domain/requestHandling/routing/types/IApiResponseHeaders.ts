import type { IJsonSchemaFragment, IJsonValue } from "@glacier/schema";

/** Documented response fields, distinct from the actual fields on a response envelope. */
export interface IApiResponseHeaders {
  /** Contract for each named response header; keys are header names. */
  readonly [name: string]: {
    /** Optional human-readable header purpose. */
    readonly description?: string;
    /** Whether the documented response includes this header; OpenAPI defaults omission to false.
     * @default false
     */
    readonly required?: boolean;
    /** JSON schema fragment describing the header value. */
    readonly schema: IJsonSchemaFragment;
    /** Optional JSON-compatible example value. */
    readonly example?: IJsonValue;
  };
}
