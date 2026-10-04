import type { IFeature } from "./IAcceptanceCatalog.model.js";
import type { IDiscoveredTest } from "./ScenarioDiscovery.service.js";
import { CatalogStructure } from "./CatalogStructure.schema.js";
import type { ICatalogValidation } from "./ICatalogValidation.model.js";

/** Validates forward-only inventory, criteria, scenario, data, and discovered-test relationships. */
export class CatalogValidatorService {
  /** Accumulates expected input failures without claiming any executable test ran. */
  public static validate(value: unknown, tests: readonly IDiscoveredTest[]): ICatalogValidation {
    const issues: string[] = [];
    if (!CatalogStructure.isCatalog(value, issues)) return { isValid: false, issues };
    const identifiers = new Set<string>();
    for (const entries of [
      value.features,
      value.apiOperations,
      value.criteria,
      value.scenarios,
      value.personas,
      value.datasets,
    ]) {
      for (const record of entries) {
        if (identifiers.has(record.id)) issues.push(`${record.id}: duplicate catalog ID`);
        identifiers.add(record.id);
      }
    }
    for (const criterion of value.criteria) {
      if (criterion.featureIds.length + criterion.apiOperationIds.length === 0) {
        issues.push(`${criterion.id}: must reference a feature or API operation`);
      }
      CatalogValidatorService.checkReferences(
        criterion.id,
        criterion.featureIds,
        value.features,
        issues,
      );
      CatalogValidatorService.checkReferences(
        criterion.id,
        criterion.apiOperationIds,
        value.apiOperations,
        issues,
      );
      if (!value.scenarios.some((scenario) => scenario.criterionIds.includes(criterion.id))) {
        issues.push(`${criterion.id}: criterion without scenarios`);
      }
    }
    for (const feature of value.features) {
      if (!value.criteria.some((criterion) => criterion.featureIds.includes(feature.id))) {
        issues.push(`${feature.id}: feature without criteria`);
      }
    }
    for (const operation of value.apiOperations) {
      if (!value.criteria.some((criterion) => criterion.apiOperationIds.includes(operation.id))) {
        issues.push(`${operation.id}: API operation without criteria`);
      }
    }
    for (const scenario of value.scenarios) {
      CatalogValidatorService.checkReferences(
        scenario.id,
        scenario.criterionIds,
        value.criteria,
        issues,
      );
      CatalogValidatorService.checkReferences(
        scenario.id,
        scenario.personaIds,
        value.personas,
        issues,
      );
      CatalogValidatorService.checkReferences(
        scenario.id,
        scenario.datasetIds,
        value.datasets,
        issues,
      );
      if (!tests.some((test) => test.scenarioIds.includes(scenario.id))) {
        issues.push(`${scenario.id}: scenario without discovered tests`);
      }
    }
    const paths = new Set<string>();
    for (const test of tests) {
      if (
        !/^tests\/scenarios\/(?:[^/]+\/)+[^/]+\.spec\.ts$/.test(test.path) ||
        test.path.split("/").some((segment) => segment === ".." || segment === ".")
      ) {
        issues.push(`${test.path}: test outside capability-owned scenario discovery`);
      }
      if (paths.has(test.path)) issues.push(`${test.path}: duplicate test path`);
      paths.add(test.path);
      if (test.scenarioIds.length === 0)
        issues.push(`${test.path}: discovered test without scenario metadata`);
      if (new Set(test.scenarioIds).size !== test.scenarioIds.length)
        issues.push(`${test.path}: duplicate scenario metadata`);
      CatalogValidatorService.checkReferences(test.path, test.scenarioIds, value.scenarios, issues);
    }
    return issues.length > 0 ? { isValid: false, issues } : { isValid: true, catalog: value };
  }

  /** Checks each relationship against its own typed inventory, not merely any global ID. */
  private static checkReferences(
    owner: string,
    references: readonly string[],
    targets: readonly IFeature[],
    issues: string[],
  ): void {
    const identifiers = new Set(targets.map((target) => target.id));
    for (const reference of references) {
      if (!identifiers.has(reference)) issues.push(`${owner}: unknown reference ${reference}`);
    }
  }
}
