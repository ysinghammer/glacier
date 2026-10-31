import type { IJsonSchemaFragment, IJsonValue } from "@glacier/schema";

/** Documented response fields, distinct from the actual fields on a response envelope. */
export interface IApiResponseHeaders {
  readonly [name: string]: {
    readonly description?: string;
    readonly required?: boolean;
    readonly schema: IJsonSchemaFragment;
    readonly example?: IJsonValue;
  };
}
