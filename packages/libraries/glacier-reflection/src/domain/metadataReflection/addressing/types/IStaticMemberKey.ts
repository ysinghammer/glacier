import type { IClass } from "../../targets/types/IClass.js";
/** Static constructor keys excluding the unsupported `prototype` location.
 * @template C Constructor whose public static keys are selected.
 */
export type IStaticMemberKey<C extends IClass> = Exclude<keyof C, "prototype">;
