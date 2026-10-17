// @scenario IOC-013
import { describe, expect, it } from "vitest";
import { GlacierContainer, Module, UnknownDependencyError } from "../../../index.js";
import { ParameterTypes } from "./ParameterTypes.js";

class Clock {}
class Hidden {}

class ClockModule {}
Module({ providers: [Clock, Hidden], exports: [Clock], global: true })(ClockModule);

class Feature {}
Module({})(Feature);

class Application {}
Module({ imports: [ClockModule, Feature] })(Application);

describe("IOC-013 global modules", () => {
  it("shows global exports to modules that do not import the global module", async () => {
    const container = await GlacierContainer.create(Application);

    expect(container.select(Feature).get(Clock)).toBeInstanceOf(Clock);
  });

  it("keeps non-exported providers of a global module private", async () => {
    const container = await GlacierContainer.create(Application);

    expect(() => container.select(Feature).get(Hidden)).toThrow(UnknownDependencyError);
  });

  it("injects global providers into providers of other modules", async () => {
    class Reporter {
      public constructor(readonly clock: Clock) {}
    }
    ParameterTypes.emit(Reporter, [Clock]);
    class Reporting {}
    Module({ providers: [Reporter], exports: [Reporter] })(Reporting);
    class Root {}
    Module({ imports: [ClockModule, Reporting] })(Root);

    const container = await GlacierContainer.create(Root);

    expect(container.get(Reporter).clock).toBe(container.get(Clock));
  });

  it("does not register a global module that the root cannot reach", async () => {
    class Unreachable {}
    Module({ providers: [Clock], exports: [Clock], global: true })(Unreachable);
    class Root {}
    Module({})(Root);

    const container = await GlacierContainer.create(Root);
    expect(() => container.get(Clock)).toThrow(UnknownDependencyError);
  });
});
