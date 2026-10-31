import type { IClass } from "@glacier/reflection";

/** Normalized dependency identity: a class constructor or symbol, never a string. */
export type IToken = IClass | symbol;
