import type { IAcceptanceCatalog } from "./IAcceptanceCatalog.model.js";

const HTTP_METHODS = new Set([
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
  "TRACE",
  "CONNECT",
]);
const COLLECTIONS = [
  "features",
  "apiOperations",
  "criteria",
  "scenarios",
  "personas",
  "datasets",
] as const;

/** Narrows untrusted catalog values; structural rejections accumulate actionable diagnostics. */
export class CatalogStructure {
  /** Checks every required collection and record without coercion or unchecked assertions. */
  public static isCatalog(value: unknown, issues: string[]): value is IAcceptanceCatalog {
    if (!CatalogStructure.isRecord(value)) {
      issues.push("catalog: expected an object");
      return false;
    }
    const initialCount = issues.length;
    CatalogStructure.checkKeys(value, COLLECTIONS, "catalog", issues);
    for (const collection of COLLECTIONS) {
      const records = value[collection];
      if (!Array.isArray(records)) {
        issues.push(`${collection}: expected an array`);
        continue;
      }
      for (const [index, record] of records.entries()) {
        CatalogStructure.checkRecord(record, collection, index, issues);
      }
    }
    return issues.length === initialCount;
  }

  /** Rejects null, arrays, and scalars at object boundaries. */
  private static isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  /** Reports malformed fields using collection position and the available record ID. */
  private static checkRecord(
    value: unknown,
    collection: string,
    index: number,
    issues: string[],
  ): void {
    if (!CatalogStructure.isRecord(value)) {
      issues.push(`${collection}[${index}]: expected a record`);
      return;
    }
    const identifier = typeof value["id"] === "string" ? value["id"] : "<invalid-id>";
    const location = `${collection}[${index}] (${identifier})`;
    const keys = ["id", "title", "sourceReferences"];
    CatalogStructure.checkText(value["id"], `${location}.id`, issues);
    if (typeof value["id"] === "string" && !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value["id"])) {
      issues.push(`${location}.id: expected a stable identifier without whitespace`);
    }
    CatalogStructure.checkText(value["title"], `${location}.title`, issues);
    CatalogStructure.checkStrings(
      value["sourceReferences"],
      `${location}.sourceReferences`,
      true,
      issues,
    );
    if (collection === "apiOperations") {
      keys.push("method", "path");
      if (typeof value["method"] !== "string" || !HTTP_METHODS.has(value["method"])) {
        issues.push(`${location}.method: expected an uppercase HTTP method`);
      }
      if (typeof value["path"] !== "string" || !/^\/\S*$/.test(value["path"])) {
        issues.push(`${location}.path: expected a public absolute HTTP path`);
      }
    } else if (collection === "criteria") {
      keys.push("featureIds", "apiOperationIds", "given", "when", "then");
      CatalogStructure.checkStrings(value["featureIds"], `${location}.featureIds`, false, issues);
      CatalogStructure.checkStrings(
        value["apiOperationIds"],
        `${location}.apiOperationIds`,
        false,
        issues,
      );
      CatalogStructure.checkStrings(value["given"], `${location}.given`, true, issues);
      CatalogStructure.checkText(value["when"], `${location}.when`, issues);
      CatalogStructure.checkStrings(value["then"], `${location}.then`, true, issues);
    } else if (collection === "scenarios") {
      keys.push("criterionIds", "personaIds", "datasetIds");
      for (const key of ["criterionIds", "personaIds", "datasetIds"]) {
        CatalogStructure.checkStrings(value[key], `${location}.${key}`, true, issues);
      }
    } else if (collection === "personas" || collection === "datasets") {
      keys.push("definition");
      CatalogStructure.checkText(value["definition"], `${location}.definition`, issues);
    }
    CatalogStructure.checkKeys(value, keys, location, issues);
  }

  /** Rejects missing/empty text instead of providing a success-shaped default. */
  private static checkText(value: unknown, location: string, issues: string[]): void {
    if (typeof value !== "string" || value.trim().length === 0 || value !== value.trim()) {
      issues.push(`${location}: expected nonempty, trimmed text`);
    }
  }

  /** Requires unique string values, allowing emptiness only for optional relationship lists. */
  private static checkStrings(
    value: unknown,
    location: string,
    isRequired: boolean,
    issues: string[],
  ): void {
    if (!Array.isArray(value)) {
      issues.push(`${location}: expected a string array`);
      return;
    }
    if (isRequired && value.length === 0) {
      issues.push(`${location}: must not be empty`);
    }
    const seen = new Set<string>();
    for (const item of value) {
      CatalogStructure.checkText(item, location, issues);
      if (typeof item === "string") {
        if (seen.has(item)) issues.push(`${location}: duplicate value ${item}`);
        seen.add(item);
      }
    }
  }

  /** Rejects undeclared properties, including accidentally duplicated reverse relationships. */
  private static checkKeys(
    value: Record<string, unknown>,
    keys: readonly string[],
    location: string,
    issues: string[],
  ): void {
    for (const key of Object.keys(value)) {
      if (!keys.includes(key)) issues.push(`${location}: unknown field ${key}`);
    }
  }
}
