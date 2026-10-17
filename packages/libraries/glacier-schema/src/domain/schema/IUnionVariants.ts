import type { IClass } from "@glacier/reflection";

/** Discriminator value to variant class, given directly or as a `() => Class` reference for forward references and cycles. */
export type IUnionVariants = Readonly<Record<string, IClass | (() => IClass)>>;
