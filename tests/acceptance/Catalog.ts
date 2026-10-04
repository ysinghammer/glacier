import type { IAcceptanceCatalog } from "./validation/IAcceptanceCatalog.model.js";

/** Empty approved inventory: no application or service public behavior exists yet. */
export const CATALOG: IAcceptanceCatalog = {
  features: [],
  apiOperations: [],
  criteria: [],
  scenarios: [],
  personas: [],
  datasets: [],
};
