/** Declares the required public behaviors independently of executable tests. */
export interface IAcceptanceCatalog {
  readonly features: readonly IFeature[];
  readonly apiOperations: readonly IApiOperation[];
  readonly criteria: readonly IAcceptanceCriterion[];
  readonly scenarios: readonly IAcceptanceScenario[];
  readonly personas: readonly IDataDefinition[];
  readonly datasets: readonly IDataDefinition[];
}

/** Inventories one public UI capability and its requirement sources. */
export interface IFeature {
  readonly id: string;
  readonly title: string;
  readonly sourceReferences: readonly string[];
}

/** Inventories a public HTTP operation independently of its tests. */
export interface IApiOperation extends IFeature {
  readonly method: string;
  readonly path: string;
}

/** Defines one approved, observable public rule with forward-only relationships. */
export interface IAcceptanceCriterion extends IFeature {
  readonly featureIds: readonly string[];
  readonly apiOperationIds: readonly string[];
  readonly given: readonly string[];
  readonly when: string;
  readonly then: readonly string[];
}

/** Declares a required concrete journey without duplicating test mappings. */
export interface IAcceptanceScenario extends IFeature {
  readonly criterionIds: readonly string[];
  readonly personaIds: readonly string[];
  readonly datasetIds: readonly string[];
}

/** Defines representative actors or deterministic data owned by the test suite. */
export interface IDataDefinition extends IFeature {
  readonly definition: string;
}
