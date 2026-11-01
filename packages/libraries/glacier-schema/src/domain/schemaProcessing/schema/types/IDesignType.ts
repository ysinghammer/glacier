import type { IClass } from "@glacier/reflection";

/** Runtime representation of a property's declared type that the primitive decorators can check against. */
export type IDesignType =
  | { readonly kind: "string" | "number" | "boolean" | "bigint" | "date" }
  | { readonly kind: "class"; readonly target: IClass };
