import type { INumberRules } from "./INumberRules.js";
import type { IStringRules } from "./IStringRules.js";

/** Scalar values accepted by `IsLiteral`. */
export type ILiteralValue = string | number | boolean | bigint | null;

/** Declared type of one schema field; later phases extend this union with collections and nesting. */
export type ITypeSpec =
  | { readonly kind: "string"; readonly rules: IStringRules }
  | { readonly kind: "number"; readonly rules: INumberRules }
  | { readonly kind: "int"; readonly rules: INumberRules }
  | { readonly kind: "boolean" }
  | { readonly kind: "bigint" }
  | { readonly kind: "date" }
  | { readonly kind: "literal"; readonly value: ILiteralValue }
  | { readonly kind: "enum"; readonly values: readonly (string | number)[] }
  | { readonly kind: "any" };
