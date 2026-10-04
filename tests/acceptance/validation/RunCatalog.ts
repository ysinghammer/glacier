import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { CATALOG } from "../Catalog.js";
import { AcceptanceReportService } from "../../reporting/AcceptanceReport.service.js";
import { ReportDirectoryService } from "../../reporting/ReportDirectory.service.js";
import { CatalogValidatorService } from "./CatalogValidator.service.js";
import { ScenarioDiscoveryService } from "./ScenarioDiscovery.service.js";

const root = process.cwd();
const tests = await ScenarioDiscoveryService.discover(root);
const result = CatalogValidatorService.validate(CATALOG, tests);
const directory = await ReportDirectoryService.create(root, "acceptance-report");
if (!result.isValid) {
  await writeFile(join(directory, "validation.json"), JSON.stringify(result, null, 2) + "\n");
  console.error(result.issues.join("\n"));
  process.exitCode = 1;
} else {
  await writeFile(
    join(directory, "traceability.json"),
    JSON.stringify(AcceptanceReportService.create(result.catalog, tests), null, 2) + "\n",
  );
  console.log(
    `Catalog valid: ${result.catalog.criteria.length} criteria, ${tests.length} discovered specs. Execution: not-run. Report: ${directory}`,
  );
}
