import { expect } from "vitest";
import type { IOpenApiDocument } from "../../index.js";

/** Public document assertions distinguish reference resolution from external specification validation. */
export class OpenApiEvidence {
  /**
   * Verifies local schema references against the public document's returned components.
   * @param document Generated OpenAPI document under assertion.
   * @returns No value; fails the test when a local reference is unresolved.
   */
  public static references(document: IOpenApiDocument): void {
    const components = document.components.schemas;
    expect(typeof components).toBe("object");
    OpenApiEvidence.walk(document, components);
  }

  /**
   * Recursively checks local refs while leaving literal schema examples unchanged.
   * @param value Document value or nested array being inspected.
   * @param components Schema component collection used to resolve references.
   * @param isMapping Whether strings are mapping refs; defaults to false.
   * @returns No value; asserts each encountered local reference exists.
   */
  private static walk(value: unknown, components: unknown, isMapping = false): void {
    if (Array.isArray(value)) {
      for (const item of value) OpenApiEvidence.walk(item, components);
      return;
    }
    if (typeof value !== "object" || value === null) return;
    for (const [key, child] of Object.entries(value)) {
      if ((key === "$ref" || isMapping) && typeof child === "string") {
        expect(child.startsWith("#/components/schemas/")).toBe(true);
        const name = decodeURIComponent(child.slice("#/components/schemas/".length))
          .replaceAll("~1", "/")
          .replaceAll("~0", "~");
        expect(
          typeof components === "object" && components !== null && Object.hasOwn(components, name),
        ).toBe(true);
      } else if (
        !key.startsWith("x-") &&
        !["examples", "example", "enum", "const", "default"].includes(key)
      )
        OpenApiEvidence.walk(child, components, key === "mapping");
    }
  }
}
