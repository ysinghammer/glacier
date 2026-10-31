import type { IConstructableClass } from "@glacier/reflection";
import type { IApiBodyOptions } from "./IApiBodyOptions.js";
import type { IApiParamOptions } from "./IApiParamOptions.js";
import type { IApiInputOptions } from "./IApiInputOptions.js";

/**
 * Immutable discriminated records for each explicit handler parameter binding.
 * @property index Zero-based handler parameter position.
 * @property location Input source selected by the binder declaration.
 * @property dto Explicit DTO class identity; never inferred or constructed.
 * @property options Static input documentation and examples.
 * @property name Required path, header, or cookie field name where applicable.
 */
export type IHttpBindingMetadata =
  | {
      readonly index: number;
      readonly location: "body";
      readonly dto: IConstructableClass<object>;
      readonly options: IApiBodyOptions;
    }
  | {
      readonly index: number;
      readonly location: "query" | "params" | "headers" | "cookies";
      readonly dto: IConstructableClass<object>;
      readonly options: IApiInputOptions;
    }
  | {
      readonly index: number;
      readonly location: "param";
      readonly name: string;
      readonly options: IApiParamOptions;
    }
  | {
      readonly index: number;
      readonly location: "header" | "cookie";
      readonly name: string;
      readonly options: IApiInputOptions;
    }
  | { readonly index: number; readonly location: "request" | "userId" };
