import type { IClass } from "@glacier/reflection";
import type { ICollectionRules } from "./ICollectionRules.js";
import type { INumberRules } from "./INumberRules.js";
import type { ISizeRules } from "./ISizeRules.js";
import type { IStringRules } from "./IStringRules.js";

/** Scalar values accepted by `IsLiteral`. */
export type ILiteralValue = string | number | boolean | bigint | null;

/** Declared type of one schema field; collections hold element specifications, and `object` and `lazy` nest another class, `union` selects a class by discriminator and `oneOf` tries each option. */
export type ITypeSpec =
  | { readonly kind: "string"; readonly rules: IStringRules }
  | { readonly kind: "number"; readonly rules: INumberRules }
  | { readonly kind: "int"; readonly rules: INumberRules }
  | { readonly kind: "boolean" }
  | { readonly kind: "bigint" }
  | { readonly kind: "date" }
  | { readonly kind: "literal"; readonly value: ILiteralValue }
  | { readonly kind: "enum"; readonly values: readonly (string | number)[] }
  | { readonly kind: "any" }
  | { readonly kind: "array"; readonly element: ITypeSpec; readonly rules: ICollectionRules }
  | { readonly kind: "tuple"; readonly elements: readonly ITypeSpec[] }
  | { readonly kind: "set"; readonly element: ITypeSpec; readonly rules: ICollectionRules }
  | {
      readonly kind: "map";
      readonly key: ITypeSpec;
      readonly value: ITypeSpec;
      readonly rules: ISizeRules;
    }
  | { readonly kind: "record"; readonly value: ITypeSpec; readonly rules: ISizeRules }
  | { readonly kind: "object"; readonly target: IClass }
  | { readonly kind: "lazy"; readonly resolve: () => IClass }
  | {
      readonly kind: "union";
      readonly discriminator: string;
      readonly variants: ReadonlyMap<string, ITypeSpec>;
    }
  | { readonly kind: "oneOf"; readonly options: readonly ITypeSpec[] };
