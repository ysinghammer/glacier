import type { IAcceptanceCatalog } from "../acceptance/validation/IAcceptanceCatalog.model.js";
import type { IDiscoveredTest } from "../acceptance/validation/ScenarioDiscovery.service.js";

/** Reports derived traceability, explicitly distinguishing mapping from execution. */
export interface IAcceptanceReport {
  readonly execution: { readonly status: "not-run"; readonly results: null };
  readonly inventory: readonly {
    readonly kind: "feature" | "api-operation";
    readonly id: string;
    readonly criteria: readonly {
      readonly id: string;
      readonly scenarios: readonly { readonly id: string; readonly tests: readonly string[] }[];
    }[];
  }[];
  readonly tests: readonly {
    readonly path: string;
    readonly scenarios: readonly {
      readonly id: string;
      readonly criterionIds: readonly string[];
      readonly featureIds: readonly string[];
      readonly apiOperationIds: readonly string[];
    }[];
  }[];
}

/** Derives both directions from the catalog's sole forward declarations and discovered test metadata. */
export class AcceptanceReportService {
  /** Requires previously validated inputs; does not synthesize passed, skipped, or failed execution results. */
  public static create(
    catalog: IAcceptanceCatalog,
    tests: readonly IDiscoveredTest[],
  ): IAcceptanceReport {
    return {
      execution: { status: "not-run", results: null },
      inventory: [
        ...catalog.features.map((feature) => ({
          kind: "feature" as const,
          id: feature.id,
          criteria: AcceptanceReportService.criteriaFor(catalog, tests, feature.id, "feature"),
        })),
        ...catalog.apiOperations.map((operation) => ({
          kind: "api-operation" as const,
          id: operation.id,
          criteria: AcceptanceReportService.criteriaFor(
            catalog,
            tests,
            operation.id,
            "api-operation",
          ),
        })),
      ],
      tests: tests.map((test) => ({
        path: test.path,
        scenarios: catalog.scenarios
          .filter((scenario) => test.scenarioIds.includes(scenario.id))
          .map((scenario) => {
            const criteria = catalog.criteria.filter((criterion) =>
              scenario.criterionIds.includes(criterion.id),
            );
            return {
              id: scenario.id,
              criterionIds: criteria.map((criterion) => criterion.id),
              featureIds: [...new Set(criteria.flatMap((criterion) => criterion.featureIds))],
              apiOperationIds: [
                ...new Set(criteria.flatMap((criterion) => criterion.apiOperationIds)),
              ],
            };
          }),
      })),
    };
  }

  /** Builds inventory-to-test mappings without maintaining a reverse registry. */
  private static criteriaFor(
    catalog: IAcceptanceCatalog,
    tests: readonly IDiscoveredTest[],
    identifier: string,
    kind: "feature" | "api-operation",
  ): IAcceptanceReport["inventory"][number]["criteria"] {
    return catalog.criteria
      .filter((criterion) =>
        (kind === "feature" ? criterion.featureIds : criterion.apiOperationIds).includes(
          identifier,
        ),
      )
      .map((criterion) => ({
        id: criterion.id,
        scenarios: catalog.scenarios
          .filter((scenario) => scenario.criterionIds.includes(criterion.id))
          .map((scenario) => ({
            id: scenario.id,
            tests: tests
              .filter((test) => test.scenarioIds.includes(scenario.id))
              .map((test) => test.path),
          })),
      }));
  }
}
