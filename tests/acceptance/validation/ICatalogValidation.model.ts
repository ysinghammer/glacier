import type { IAcceptanceCatalog } from "./IAcceptanceCatalog.model.js";

/** Separates expected catalog rejection from a validated catalog. */
export type ICatalogValidation =
  | { readonly isValid: true; readonly catalog: IAcceptanceCatalog }
  | { readonly isValid: false; readonly issues: readonly string[] };
