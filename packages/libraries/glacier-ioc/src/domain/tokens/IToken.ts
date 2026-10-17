import type { IClass } from "@glacier/reflection";

/** Identity of a dependency: a class constructor or a symbol; string tokens are intentionally unsupported. */
export type IToken = IClass | symbol;
