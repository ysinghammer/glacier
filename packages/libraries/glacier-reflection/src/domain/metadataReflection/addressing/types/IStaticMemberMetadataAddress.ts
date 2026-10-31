import type { IClass } from "../../targets/types/IClass.js";
import type { IStaticMemberKey } from "./IStaticMemberKey.js";
/** Checked address for one static key on a constructor surface.
 * @template C Constructor whose keys constrain the member field.
 */
export interface IStaticMemberMetadataAddress<C extends IClass> {
  /** Readonly discriminator identifying a member location, not class or parameter metadata. */
  readonly kind: "member";
  /** Readonly required static side; unlike instance addresses it is never omitted. */
  readonly side: "static";
  /** Readonly static key belonging to C, excluding its prototype location. */
  readonly member: IStaticMemberKey<C>;
}
