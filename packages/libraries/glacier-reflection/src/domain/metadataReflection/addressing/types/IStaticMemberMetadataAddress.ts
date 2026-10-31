import type { IClass } from "../../targets/types/IClass.js";
import type { IStaticMemberKey } from "./IStaticMemberKey.js";
/** Checked static member requiring an explicit static side. */
export interface IStaticMemberMetadataAddress<C extends IClass> {
  readonly kind: "member";
  readonly side: "static";
  readonly member: IStaticMemberKey<C>;
}
