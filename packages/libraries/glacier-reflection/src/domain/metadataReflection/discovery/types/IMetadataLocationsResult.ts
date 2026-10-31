import type { IMetadataAddressRejection } from "../../addressing/types/IMetadataAddressRejection.js";
import type { IDiscoveredMetadataAddress } from "../../addressing/types/IDiscoveredMetadataAddress.js";
/** Result of discovering distinct metadata-bearing locations, not all runtime members.
 * @property isValid Readonly discriminator; false is rejection, true is completed discovery.
 * @property addresses Readonly frozen canonical addresses in unspecified order when valid.
 * @property code Readonly rejection category when isValid is false.
 */
export type IMetadataLocationsResult =
  | IMetadataAddressRejection
  | { readonly isValid: true; readonly addresses: readonly IDiscoveredMetadataAddress[] };
