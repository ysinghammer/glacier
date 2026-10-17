import type { IClass } from "../targets/IClass.js";

/** Runtime representation only; erased source types and constructability are not recovered. */
export type IRuntimeType = ((...arguments_: never[]) => unknown) | IClass | undefined;
