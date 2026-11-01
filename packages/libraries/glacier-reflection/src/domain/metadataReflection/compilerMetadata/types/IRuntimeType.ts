import type { IClass } from "../../targets/types/IClass.js";

/** Function/class reference or undefined emitted at runtime; erased types and constructability are not recovered. */
export type IRuntimeType = ((...arguments_: never[]) => unknown) | IClass | undefined;
