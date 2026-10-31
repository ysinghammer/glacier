import "@glacier/reflection/register";
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

type ILegacyCase = readonly [IDynamicClassMetadataAddress | undefined, string];

/** Splits compiler-emission checks by address and inheritance while asserting only public metadata operations. */
class LegacyEmissionAssertions {
  static expectedDefinitions(
    cases: readonly ILegacyCase[],
    fixture: ReturnType<typeof LegacyLocations.create>,
  ): ReadonlyMap<string, ReadonlySet<object>> {
    return new Map(
      cases.map(([address, value]) => {
        const definitions = LegacyEmissionAssertions.#compilerDefinitions(address, value);
        return [value, new Set([fixture.metadata, ...definitions])] as const;
      }),
    );
  }

  static #compilerDefinitions(
    address: IDynamicClassMetadataAddress | undefined,
    value: string,
  ): object[] {
    const definitions: object[] = [];
    if (address === undefined) {
      definitions.push(DESIGN_PARAMETER_TYPES_METADATA);
      return definitions;
    }
    if (address.kind !== "member") return definitions;
    definitions.push(DESIGN_TYPE_METADATA);
    if (["numeric-method", "symbol-method", "method", "static-method"].includes(value)) {
      definitions.push(DESIGN_PARAMETER_TYPES_METADATA, DESIGN_RETURN_TYPE_METADATA);
    } else if (["accessor", "static-accessor", "setter", "static-setter"].includes(value)) {
      definitions.push(DESIGN_PARAMETER_TYPES_METADATA);
    }
    return definitions;
  }

  static verifyCases(
    cases: readonly ILegacyCase[],
    fixture: ReturnType<typeof LegacyLocations.create>,
    expected: ReadonlyMap<string, ReadonlySet<object>>,
  ): void {
    for (const [address, value] of cases) {
      expect(fixture.metadata.readDynamic(fixture.Consumer, address)).toEqual({
        isValid: true,
        isPresent: true,
        value,
      });
      for (const inheritance of ["own", "inherited"] as const)
        LegacyEmissionAssertions.#verifyCase(fixture, address, value, inheritance, expected);
    }
  }

  static #verifyCase(
    fixture: ReturnType<typeof LegacyLocations.create>,
    address: IDynamicClassMetadataAddress | undefined,
    value: string,
    inheritance: "own" | "inherited",
    expected: ReadonlyMap<string, ReadonlySet<object>>,
  ): void {
    const lookup = { ...(address ?? { kind: "class" as const }), inheritance };
    const discovered = MetadataDiscovery.definitionsDynamic(fixture.Consumer, lookup);
    if (!discovered.isValid) throw new Error(discovered.code);
    expect(new Set(discovered.definitions)).toEqual(expected.get(value));
    expect(fixture.metadata.readDynamic(fixture.Consumer, lookup)).toEqual({
      isValid: true,
      isPresent: true,
      value,
    });
  }

  static verifyLocations(
    cases: readonly ILegacyCase[],
    fixture: ReturnType<typeof LegacyLocations.create>,
    expected: ReadonlyMap<string, ReadonlySet<object>>,
  ): void {
    for (const inheritance of ["own", "inherited"] as const) {
      const locations = fixture.metadata.locations(fixture.Consumer, { inheritance });
      if (!locations.isValid) throw new Error(locations.code);
      expect(locations.addresses).toHaveLength(cases.length);
      for (const address of locations.addresses)
        LegacyEmissionAssertions.#verifyLocation(fixture, address, inheritance, expected);
    }
  }

  static #verifyLocation(
    fixture: ReturnType<typeof LegacyLocations.create>,
    address: IDynamicClassMetadataAddress,
    inheritance: "own" | "inherited",
    expected: ReadonlyMap<string, ReadonlySet<object>>,
  ): void {
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
    if (!discovered.isValid) throw new Error(discovered.code);
    expect(new Set(discovered.definitions)).toEqual(expected.get(read.value));
  }

  static verifyProtected(fixture: ReturnType<typeof LegacyLocations.create>): void {
    const cases: readonly [IDynamicClassMetadataAddress, string][] = [
      [{ kind: "constructor-parameter", position: 0 }, "protected-constructor"],
      [{ kind: "member", member: "method" }, "private-method"],
      [{ kind: "member", member: "guarded" }, "protected-method"],
      [{ kind: "method-parameter", member: "method", position: 0 }, "private-parameter"],
      [{ kind: "method-parameter", member: "guarded", position: 0 }, "protected-parameter"],
    ];
    for (const [address, value] of cases)
      for (const inheritance of ["own", "inherited"] as const)
        expect(
          fixture.metadata.readDynamic(fixture.ProtectedConsumer, { ...address, inheritance }),
        ).toEqual({ isValid: true, isPresent: true, value });
  }
}

describe("genuine legacy compiler emission", () => {
  it("records all legacy locations and discovered identities without constructing consumers or invoking getters", () => {
    expect(() => LegacyLocations.create()).not.toThrow();
    const fixture = LegacyLocations.create();
    const cases: readonly ILegacyCase[] = [
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
    const expectedDefinitions = LegacyEmissionAssertions.expectedDefinitions(cases, fixture);
    LegacyEmissionAssertions.verifyCases(cases, fixture, expectedDefinitions);
    LegacyEmissionAssertions.verifyLocations(cases, fixture, expectedDefinitions);
    LegacyEmissionAssertions.verifyProtected(fixture);
    expect(fixture.constructionCount).toBe(0);
    expect(fixture.getterCount).toBe(0);
  });
  it("executes the compiled adoption example as additional smoke evidence", () => {
    expect(AdoptionExample.run()).toBeGreaterThan(0);
  });
});
