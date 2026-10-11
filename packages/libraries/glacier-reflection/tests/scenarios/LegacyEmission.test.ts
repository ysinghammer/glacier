import { describe, expect, it } from "vitest";
import {
  MetadataDiscovery,
  DESIGN_TYPE_METADATA,
  DESIGN_PARAMETER_TYPES_METADATA,
  DESIGN_RETURN_TYPE_METADATA,
  type IDynamicClassMetadataAddress,
} from "@glacier/reflection";
import { LegacyLocations } from "../artifacts/compiler/LegacyLocations.js";
import { AdoptionExample } from "../artifacts/compiler/AdoptionExample.js";

describe("genuine legacy compiler emission", () => {
  it("records all legacy locations and discovered identities without constructing consumers or invoking getters", () => {
    expect(() => LegacyLocations.create()).not.toThrow();
    const fixture = LegacyLocations.create();
    const cases: readonly [IDynamicClassMetadataAddress | undefined, string][] = [
      [undefined, "class"],
      [{ kind: "member", member: "property" }, "property"],
      [{ kind: "member", side: "static", member: "property" }, "static-property"],
      [{ kind: "member", member: "hidden" }, "private"],
      [{ kind: "member", member: "guarded" }, "protected"],
      [{ kind: "member", member: 7 }, "numeric"],
      [{ kind: "member", member: fixture.key }, "symbol"],
      [{ kind: "member", side: "static", member: fixture.key }, "static-symbol"],
      [{ kind: "member", side: "static", member: 9 }, "static-numeric"],
      [{ kind: "member", side: "static", member: "hidden" }, "static-private"],
      [{ kind: "member", member: 8 }, "numeric-method"],
      [{ kind: "member", member: fixture.methodKey }, "symbol-method"],
      [{ kind: "method-parameter", member: 8, position: 0 }, "numeric-parameter"],
      [{ kind: "method-parameter", member: fixture.methodKey, position: 0 }, "symbol-parameter"],
      [{ kind: "member", member: "method" }, "method"],
      [{ kind: "member", side: "static", member: "method" }, "static-method"],
      [{ kind: "member", member: "accessor" }, "accessor"],
      [{ kind: "member", side: "static", member: "accessor" }, "static-accessor"],
      [{ kind: "member", member: "setter" }, "setter"],
      [{ kind: "member", side: "static", member: "setter" }, "static-setter"],
      [{ kind: "constructor-parameter", position: 0 }, "constructor"],
      [{ kind: "method-parameter", member: "method", position: 0 }, "parameter"],
      [
        { kind: "method-parameter", side: "static", member: "method", position: 0 },
        "static-parameter",
      ],
    ];
    const expectedDefinitions = new Map(
      cases.map(([address, value]) => {
        const compilerDefinitions = [];
        if (address === undefined) compilerDefinitions.push(DESIGN_PARAMETER_TYPES_METADATA);
        else if (address.kind === "member") {
          compilerDefinitions.push(DESIGN_TYPE_METADATA);
          if (["numeric-method", "symbol-method", "method", "static-method"].includes(value)) {
            compilerDefinitions.push(DESIGN_PARAMETER_TYPES_METADATA, DESIGN_RETURN_TYPE_METADATA);
          } else if (["accessor", "static-accessor", "setter", "static-setter"].includes(value)) {
            compilerDefinitions.push(DESIGN_PARAMETER_TYPES_METADATA);
          }
        }
        return [value, new Set([fixture.metadata, ...compilerDefinitions])] as const;
      }),
    );
    for (const [address, value] of cases) {
      expect(fixture.metadata.readDynamic(fixture.Consumer, address)).toEqual({
        isValid: true,
        isPresent: true,
        value,
      });
      for (const inheritance of ["own", "inherited"] as const) {
        const lookup = { ...(address ?? { kind: "class" as const }), inheritance };
        const discovered = MetadataDiscovery.definitionsDynamic(fixture.Consumer, lookup);
        expect(discovered.isValid).toBe(true);
        if (!discovered.isValid) throw new Error(discovered.code);
        expect(new Set(discovered.definitions)).toEqual(expectedDefinitions.get(value));
        expect(fixture.metadata.readDynamic(fixture.Consumer, lookup)).toEqual({
          isValid: true,
          isPresent: true,
          value,
        });
      }
    }
    for (const inheritance of ["own", "inherited"] as const) {
      const locations = fixture.metadata.locations(fixture.Consumer, { inheritance });
      if (!locations.isValid) throw new Error(locations.code);
      expect(locations.addresses).toHaveLength(cases.length);
      for (const address of locations.addresses) {
        expect(fixture.metadata.hasDynamic(fixture.Consumer, { ...address, inheritance })).toEqual({
          isValid: true,
          isPresent: true,
        });
        const read = fixture.metadata.readDynamic(fixture.Consumer, { ...address, inheritance });
        if (!read.isValid || !read.isPresent) throw new Error("Missing fixture declaration");
        const discovered = MetadataDiscovery.definitionsDynamic(fixture.Consumer, {
          ...address,
          inheritance,
        });
        expect(discovered.isValid).toBe(true);
        if (!discovered.isValid) throw new Error(discovered.code);
        expect(new Set(discovered.definitions)).toEqual(expectedDefinitions.get(read.value));
      }
    }
    for (const [address, value] of [
      [{ kind: "constructor-parameter", position: 0 }, "protected-constructor"],
      [{ kind: "member", member: "method" }, "private-method"],
      [{ kind: "member", member: "guarded" }, "protected-method"],
      [{ kind: "method-parameter", member: "method", position: 0 }, "private-parameter"],
      [{ kind: "method-parameter", member: "guarded", position: 0 }, "protected-parameter"],
    ] satisfies [IDynamicClassMetadataAddress, string][]) {
      for (const inheritance of ["own", "inherited"] as const) {
        expect(
          fixture.metadata.readDynamic(fixture.ProtectedConsumer, { ...address, inheritance }),
        ).toEqual({ isValid: true, isPresent: true, value });
      }
    }
    expect(fixture.constructionCount).toBe(0);
    expect(fixture.getterCount).toBe(0);
  });
  it("executes the compiled adoption example as additional smoke evidence", () => {
    expect(AdoptionExample.run()).toBeGreaterThan(0);
  });
});
