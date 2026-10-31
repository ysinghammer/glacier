// @scenario IOC-013
import { describe, expect, it } from "vitest";
import { GlacierContainer, Module, UnknownDependencyError } from "../../../index.js";
import { ParameterTypes } from "./ParameterTypes.js";

/** Exported clock provider visible to reachable modules. */
class Clock {}
/** Non-exported provider kept private by ClockModule. */
class Hidden {}

/** Reachable global module that exports Clock but keeps Hidden private. */
class ClockModule {}
Module({ providers: [Clock, Hidden], exports: [Clock], global: true })(ClockModule);

/** Consumer module that does not import the global module directly. */
class Feature {}
Module({})(Feature);

/** Application root that makes ClockModule reachable. */
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
    /** Receives the globally visible Clock provider. */
    class Reporter {
      /**
       * Stores the injected clock for the identity assertion.
       * @param clock Clock resolved from the reachable global module.
       */
      public constructor(
        /** Clock instance resolved from the reachable global module. */
        public readonly clock: Clock,
      ) {}
    }
    ParameterTypes.emit(Reporter, [Clock]);
    /** Module providing the Reporter consumer. */
    class Reporting {}
    Module({ providers: [Reporter], exports: [Reporter] })(Reporting);
    /** Root reaching both the global provider and Reporter module. */
    class Root {}
    Module({ imports: [ClockModule, Reporting] })(Root);

    const container = await GlacierContainer.create(Root);

    expect(container.get(Reporter).clock).toBe(container.get(Clock));
  });

  it("does not register a global module that the root cannot reach", async () => {
    /** Global module intentionally omitted from the root's reachable graph. */
    class Unreachable {}
    Module({ providers: [Clock], exports: [Clock], global: true })(Unreachable);
    /** Root with no imports, used to prove unreachable globals stay inactive. */
    class Root {}
    Module({})(Root);

    const container = await GlacierContainer.create(Root);
    expect(() => container.get(Clock)).toThrow(UnknownDependencyError);
  });
});
