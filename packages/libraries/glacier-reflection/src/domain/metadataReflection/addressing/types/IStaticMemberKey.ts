import type { IClass } from "../../targets/types/IClass.js";
/** Public static keys excluding the unsupported prototype location. */
export type IStaticMemberKey<C extends IClass> = Exclude<keyof C, "prototype">;
