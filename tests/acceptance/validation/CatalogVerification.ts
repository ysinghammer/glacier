import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CATALOG } from "../Catalog.js";
import { AcceptanceReportService } from "../../reporting/AcceptanceReport.service.js";
import { ReportDirectoryService } from "../../reporting/ReportDirectory.service.js";
import type { IAcceptanceCatalog } from "./IAcceptanceCatalog.model.js";
import { CatalogValidatorService } from "./CatalogValidator.service.js";
import { ScenarioDiscoveryService } from "./ScenarioDiscovery.service.js";
import type { IDiscoveredTest } from "./ScenarioDiscovery.service.js";

/** Proves catalog rejection and report/discovery semantics using isolated technical fixtures, not product tests. */
class CatalogVerification {
  /** Executes positive/negative assertions and retains a summary; temporary fixture cleanup failures propagate. */
  public static async run(): Promise<void> {
    const catalog = CatalogVerification.validCatalog();
    const tests: readonly IDiscoveredTest[] = [
      { path: "tests/scenarios/fixture/journey.spec.ts", scenarioIds: ["SC-001"] },
    ];
    assert.equal(CatalogValidatorService.validate(CATALOG, []).isValid, true);
    assert.equal(CatalogValidatorService.validate(catalog, tests).isValid, true);
    const criterion = catalog.criteria[0];
    const scenario = catalog.scenarios[0];
    assert.ok(criterion);
    assert.ok(scenario);
    const cases: readonly {
      readonly name: string;
      readonly value: unknown;
      readonly expected: string;
      readonly tests?: readonly IDiscoveredTest[];
    }[] = [
      { name: "scalar catalog", value: null, expected: "expected an object" },
      { name: "missing collection", value: {}, expected: "expected an array" },
      {
        name: "unknown top-level field",
        value: { ...catalog, reverseMappings: [] },
        expected: "unknown field",
      },
      {
        name: "non-record criterion",
        value: { ...catalog, criteria: [null] },
        expected: "expected a record",
      },
      {
        name: "missing criterion field",
        value: { ...catalog, criteria: [{ ...criterion, when: undefined }] },
        expected: ".when",
      },
      {
        name: "malformed criterion array",
        value: { ...catalog, criteria: [{ ...criterion, given: "actor" }] },
        expected: ".given",
      },
      {
        name: "empty required outcomes",
        // oxlint-disable-next-line unicorn/no-thenable -- ADR-0007 mandates a non-callable then array.
        value: { ...catalog, criteria: [{ ...criterion, then: [] }] },
        expected: "must not be empty",
      },
      {
        name: "empty sources",
        value: { ...catalog, criteria: [{ ...criterion, sourceReferences: [] }] },
        expected: "sourceReferences",
      },
      {
        name: "unknown record field",
        value: { ...catalog, criteria: [{ ...criterion, scenarioIds: ["SC-001"] }] },
        expected: "unknown field",
      },
      {
        name: "malformed scenario",
        value: { ...catalog, scenarios: [{ ...scenario, criterionIds: [] }] },
        expected: "criterionIds",
      },
      {
        name: "malformed data definition",
        value: {
          ...catalog,
          datasets: [{ id: "DATA-001", title: "data", sourceReferences: ["fixture"] }],
        },
        expected: "definition",
      },
      {
        name: "malformed API method",
        value: { ...catalog, apiOperations: [{ ...catalog.apiOperations[0], method: "invalid" }] },
        expected: "HTTP method",
      },
      {
        name: "malformed API path",
        value: { ...catalog, apiOperations: [{ ...catalog.apiOperations[0], path: "internal" }] },
        expected: "HTTP path",
      },
      {
        name: "duplicate catalog IDs",
        value: { ...catalog, features: [...catalog.features, ...catalog.features] },
        expected: "duplicate catalog ID",
      },
      {
        name: "cross-kind duplicate ID",
        value: {
          ...catalog,
          personas: [
            {
              id: "FEATURE-001",
              title: "actor",
              sourceReferences: ["fixture"],
              definition: "actor",
            },
          ],
        },
        expected: "duplicate catalog ID",
      },
      {
        name: "duplicate relationships",
        value: {
          ...catalog,
          criteria: [{ ...criterion, featureIds: ["FEATURE-001", "FEATURE-001"] }],
        },
        expected: "duplicate value",
      },
      {
        name: "invalid identifier",
        value: {
          ...catalog,
          features: [{ id: "feature 1", title: "feature", sourceReferences: ["fixture"] }],
        },
        expected: "stable identifier",
      },
      {
        name: "unknown feature",
        value: { ...catalog, criteria: [{ ...criterion, featureIds: ["UNKNOWN"] }] },
        expected: "unknown reference UNKNOWN",
      },
      {
        name: "wrong inventory kind",
        value: { ...catalog, criteria: [{ ...criterion, featureIds: ["API-001"] }] },
        expected: "unknown reference API-001",
      },
      {
        name: "unknown API",
        value: { ...catalog, criteria: [{ ...criterion, apiOperationIds: ["UNKNOWN"] }] },
        expected: "unknown reference UNKNOWN",
      },
      {
        name: "criterion without inventory",
        value: { ...catalog, criteria: [{ ...criterion, featureIds: [], apiOperationIds: [] }] },
        expected: "must reference",
      },
      {
        name: "unmapped feature",
        value: { ...catalog, criteria: [{ ...criterion, featureIds: [] }] },
        expected: "feature without criteria",
      },
      {
        name: "unmapped API",
        value: { ...catalog, criteria: [{ ...criterion, apiOperationIds: [] }] },
        expected: "API operation without criteria",
      },
      {
        name: "criterion without scenario",
        value: { ...catalog, scenarios: [] },
        expected: "criterion without scenarios",
      },
      {
        name: "scenario without criterion",
        value: { ...catalog, scenarios: [{ ...scenario, criterionIds: ["UNKNOWN"] }] },
        expected: "unknown reference UNKNOWN",
      },
      {
        name: "scenario without tests",
        value: catalog,
        tests: [],
        expected: "scenario without discovered tests",
      },
      {
        name: "dangling persona",
        value: { ...catalog, personas: [] },
        expected: "unknown reference PERSONA-001",
      },
      {
        name: "dangling dataset",
        value: { ...catalog, datasets: [] },
        expected: "unknown reference DATA-001",
      },
      {
        name: "unknown test scenario",
        value: catalog,
        tests: [{ path: "tests/scenarios/fixture/journey.spec.ts", scenarioIds: ["UNKNOWN"] }],
        expected: "unknown reference UNKNOWN",
      },
      {
        name: "missing test metadata",
        value: catalog,
        tests: [{ path: "tests/scenarios/fixture/journey.spec.ts", scenarioIds: [] }],
        expected: "without scenario metadata",
      },
      {
        name: "duplicate test metadata",
        value: catalog,
        tests: [
          { path: "tests/scenarios/fixture/journey.spec.ts", scenarioIds: ["SC-001", "SC-001"] },
        ],
        expected: "duplicate scenario metadata",
      },
      {
        name: "duplicate test path",
        value: catalog,
        tests: [...tests, ...tests],
        expected: "duplicate test path",
      },
      {
        name: "support file as test",
        value: catalog,
        tests: [{ path: "tests/acceptance/fixture.spec.ts", scenarioIds: ["SC-001"] }],
        expected: "outside capability-owned",
      },
      {
        name: "traversal test path",
        value: catalog,
        tests: [{ path: "tests/scenarios/../journey.spec.ts", scenarioIds: ["SC-001"] }],
        expected: "outside capability-owned",
      },
    ];
    for (const fixture of cases) {
      const result = CatalogValidatorService.validate(fixture.value, fixture.tests ?? tests);
      assert.equal(result.isValid, false, fixture.name);
      if (!result.isValid) {
        assert.ok(
          result.issues.some((issue) => issue.includes(fixture.expected)),
          `${fixture.name}: ${result.issues.join("; ")}`,
        );
      }
    }
    const report = AcceptanceReportService.create(catalog, tests);
    assert.deepEqual(report.execution, { status: "not-run", results: null });
    assert.deepEqual(
      report.inventory,
      ["feature", "api-operation"].map((kind) => ({
        kind,
        id: kind === "feature" ? "FEATURE-001" : "API-001",
        criteria: [
          {
            id: "AC-001",
            scenarios: [{ id: "SC-001", tests: ["tests/scenarios/fixture/journey.spec.ts"] }],
          },
        ],
      })),
    );
    assert.deepEqual(report.tests, [
      {
        path: "tests/scenarios/fixture/journey.spec.ts",
        scenarios: [
          {
            id: "SC-001",
            criterionIds: ["AC-001"],
            featureIds: ["FEATURE-001"],
            apiOperationIds: ["API-001"],
          },
        ],
      },
    ]);
    assert.deepEqual(AcceptanceReportService.create(CATALOG, []), {
      execution: { status: "not-run", results: null },
      inventory: [],
      tests: [],
    });
    await CatalogVerification.verifyDiscovery();
    await CatalogVerification.verifyCli();
    const directory = await ReportDirectoryService.create(process.cwd(), "tooling-verification");
    await writeFile(
      join(directory, "catalog.json"),
      JSON.stringify(
        {
          status: "passed",
          negativeControls: cases.map((fixture) => fixture.name),
          productTestsExecuted: false,
        },
        null,
        2,
      ) + "\n",
    );
    console.log(
      `Catalog tooling fixtures passed: ${cases.length} rejection controls, discovery, and derived reports.`,
    );
  }

  /** Supplies illustrative technical data only; this fixture never enters the approved business inventory. */
  private static validCatalog(): IAcceptanceCatalog {
    return {
      features: [
        { id: "FEATURE-001", title: "Fixture feature", sourceReferences: ["technical fixture"] },
      ],
      apiOperations: [
        {
          id: "API-001",
          title: "Fixture API",
          sourceReferences: ["technical fixture"],
          method: "GET",
          path: "/fixture",
        },
      ],
      criteria: [
        {
          id: "AC-001",
          title: "Fixture rule",
          sourceReferences: ["technical fixture"],
          featureIds: ["FEATURE-001"],
          apiOperationIds: ["API-001"],
          given: ["Authenticated fixture actor with permission"],
          when: "Read the fixture",
          // oxlint-disable-next-line unicorn/no-thenable -- ADR-0007 mandates a non-callable then array.
          then: ["The public fixture is returned"],
        },
      ],
      scenarios: [
        {
          id: "SC-001",
          title: "Fixture journey",
          sourceReferences: ["technical fixture"],
          criterionIds: ["AC-001"],
          personaIds: ["PERSONA-001"],
          datasetIds: ["DATA-001"],
        },
      ],
      personas: [
        {
          id: "PERSONA-001",
          title: "Fixture actor",
          sourceReferences: ["technical fixture"],
          definition: "Authenticated fixture owner with read permission",
        },
      ],
      datasets: [
        {
          id: "DATA-001",
          title: "Fixture data",
          sourceReferences: ["technical fixture"],
          definition: "A fixture with identity fixture-001 and title Example",
        },
      ],
    };
  }

  /** Demonstrates restricted discovery, missing metadata rejection, and observable filesystem failures. */
  private static async verifyDiscovery(): Promise<void> {
    const root = await mkdtemp(join(tmpdir(), "glacier-catalog-"));
    try {
      assert.deepEqual(await ScenarioDiscoveryService.discover(root), []);
      for (const directory of [
        "tests/scenarios/fixture",
        "tests/acceptance",
        "tests/artifacts/fixture",
      ]) {
        await mkdir(join(root, directory), { recursive: true });
      }
      for (const path of [
        "tests/scenarios/fixture/journey.spec.ts",
        "tests/acceptance/ignored.spec.ts",
        "tests/artifacts/fixture/ignored.spec.ts",
        "tests/scenarios/fixture/support.ts",
      ]) {
        await writeFile(join(root, path), "// @scenario SC-001\n");
      }
      const tests = await ScenarioDiscoveryService.discover(root);
      assert.deepEqual(tests, [
        { path: "tests/scenarios/fixture/journey.spec.ts", scenarioIds: ["SC-001"] },
      ]);
      assert.equal(
        CatalogValidatorService.validate(CatalogVerification.validCatalog(), tests).isValid,
        true,
      );
      await writeFile(
        join(root, "tests/scenarios/fixture/journey.spec.ts"),
        "// No declared metadata\n",
      );
      assert.equal(
        CatalogValidatorService.validate(
          CatalogVerification.validCatalog(),
          await ScenarioDiscoveryService.discover(root),
        ).isValid,
        false,
      );
      await symlink(
        join(root, "tests/acceptance/ignored.spec.ts"),
        join(root, "tests/scenarios/fixture/link.spec.ts"),
      );
      await assert.rejects(ScenarioDiscoveryService.discover(root), /forbids symbolic links/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }

  /** Exercises CLI failure propagation and retained diagnostics using generated catalog fixtures. */
  private static async verifyCli(): Promise<void> {
    const root = await mkdtemp(join(tmpdir(), "glacier-catalog-cli-"));
    try {
      await cp(join(process.cwd(), "dist/tests"), join(root, "dist/tests"), { recursive: true });
      await writeFile(join(root, "package.json"), '{"type":"module"}\n');
      const catalogPath = join(root, "dist/tests/acceptance/Catalog.js");
      const valid = CatalogVerification.validCatalog();
      const cases = [
        { catalog: null, expected: "expected an object" },
        { catalog: valid, expected: "scenario without discovered tests" },
      ];
      for (const fixture of cases) {
        await writeFile(
          catalogPath,
          `export const CATALOG = ${JSON.stringify(fixture.catalog)};\n`,
        );
        const result = spawnSync(
          process.execPath,
          ["dist/tests/acceptance/validation/RunCatalog.js"],
          { cwd: root, encoding: "utf8", timeout: 30_000 },
        );
        if (result.error)
          throw new Error("Catalog CLI fixture could not start", { cause: result.error });
        assert.equal(result.status, 1, result.stderr);
        assert.ok(result.stderr.includes(fixture.expected), result.stderr);
      }
      const invocations = await readdir(join(root, "tests/artifacts"));
      assert.equal(invocations.length, cases.length);
      for (const invocation of invocations) {
        const report = await readFile(
          join(root, "tests/artifacts", invocation, "acceptance-report/validation.json"),
          "utf8",
        );
        const result: unknown = JSON.parse(report);
        assert.ok(
          typeof result === "object" &&
            result !== null &&
            "isValid" in result &&
            result.isValid === false,
        );
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }
}

await CatalogVerification.run();
