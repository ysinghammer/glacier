import type { IClass } from "../../targets/types/IClass.js";

/** Runtime representation only; erased source types and constructability are not recovered. */
export type IRuntimeType = ((...arguments_: never[]) => unknown) | IClass | undefined;
