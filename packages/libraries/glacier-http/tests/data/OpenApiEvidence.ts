import { expect } from "vitest";
import type { IOpenApiDocument } from "../../index.js";

/** Public document assertions distinguish reference resolution from external specification validation. */
export class OpenApiEvidence {
  /** Walks schema/reference-bearing document records, preserving literal example/enum/const values. */
  public static references(document: IOpenApiDocument): void {
    const components = document.components.schemas;
    expect(typeof components).toBe("object");
    OpenApiEvidence.walk(document, components);
  }

  /** Checks each local schema ref and discriminator mapping against the returned public components. */
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
