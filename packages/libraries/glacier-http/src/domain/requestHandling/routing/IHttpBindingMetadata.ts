import type { IConstructableClass } from "@glacier/reflection";
import type { IApiBodyOptions } from "./IApiBodyOptions.js";
import type { IApiParamOptions } from "./IApiParamOptions.js";
import type { IApiInputOptions } from "./IApiInputOptions.js";

/** Explicit positional binder snapshot; DTO references are never inferred or constructed. */
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
