// @scenario IOC-015
// @scenario IOC-016
import { describe, expect, it } from "vitest";
import {
  GlacierContainer,
  InvalidModuleError,
  Module,
  UnknownDependencyError,
} from "../../../index.js";

/** Provider omitted from Inner's exports. */
class Private {}
/** Provider exported by Inner for strict lookup checks. */
class Public {}

/** Module exposing Public while retaining Private as an internal provider. */
class Inner {}
Module({ providers: [Private, Public], exports: [Public] })(Inner);

/** Module importing Inner without re-exporting its private provider. */
class Outer {}
Module({ imports: [Inner] })(Outer);

describe("IOC-015 strict and non-strict lookup", () => {
  it("restricts a strict lookup to what the selected module sees", async () => {
    const container = await GlacierContainer.create(Outer);

    expect(container.get(Public, { strict: true })).toBeInstanceOf(Public);
    expect(() => container.get(Private, { strict: true })).toThrow(UnknownDependencyError);
    expect(() => container.select(Outer).get(Private)).toThrow(UnknownDependencyError);
  });

  it("searches the whole container when strict is false", async () => {
    const container = await GlacierContainer.create(Outer);

    expect(container.get(Private)).toBeInstanceOf(Private);
    expect(container.get(Private, { strict: false })).toBeInstanceOf(Private);
    expect(container.select(Outer).get(Private, { strict: false })).toBe(container.get(Private));
  });

  it("selects any reachable module and sees its own private providers", async () => {
    const container = await GlacierContainer.create(Outer);

    expect(container.select(Inner).get(Private)).toBe(container.get(Private));
  });

  it("prefers what the root sees over an unrelated module's provider of the same token", async () => {
    /** Same token provided by two modules to verify root lookup precedence. */
    class Shadowed {}
    /** Unrelated module that provides its own Shadowed instance. */
    class Other {}
    Module({ providers: [Shadowed] })(Other);
    /** Root importing Other and providing its own Shadowed instance. */
    class Root {}
    Module({ imports: [Other], providers: [Shadowed] })(Root);
    const container = await GlacierContainer.create(Root);

    expect(container.get(Shadowed)).toBe(container.select(Root).get(Shadowed));
    expect(container.get(Shadowed)).not.toBe(container.select(Other).get(Shadowed));
  });

  it("rejects selecting a module that is not part of the container", async () => {
    /** Decorated module that is not reachable from the test container. */
    class Stranger {}
    Module({})(Stranger);

    const container = await GlacierContainer.create(Outer);
    expect(() => container.select(Stranger)).toThrow(InvalidModuleError);
    expect(() => container.select({ module: Stranger })).toThrow(
      /Stranger.*not part of this container/,
    );
  });

  it("reports an unknown token with no match anywhere", async () => {
    const container = await GlacierContainer.create(Outer);
    expect(() => container.get(Symbol("absent"))).toThrow(UnknownDependencyError);
  });
});

describe("IOC-016 module de-duplication", () => {
  it("creates one module instance and one provider instance when imported twice", async () => {
    /** First module importing Inner. */
    class Left {}
    /** Second module importing Inner twice. */
    class Right {}
    Module({ imports: [Inner] })(Left);
    Module({ imports: [Inner, Inner] })(Right);
    /** Root importing Inner through both branches and directly. */
    class Root {}
    Module({ imports: [Left, Right, Inner] })(Root);
    const container = await GlacierContainer.create(Root);

    const viaLeft = container.select(Left).get(Public);
    const viaRight = container.select(Right).get(Public);

    expect(viaLeft).toBe(viaRight);
    expect(container.select(Inner)).toBeDefined();
    expect(container.get(Public)).toBe(viaLeft);
  });

  it("shares one instance of a provider exported through several importers", async () => {
    /** Provider whose construction count verifies shared module identity. */
    class Counted {
      /**
       * Number of times the container constructs this fixture.
       * @default 0
       */
      public static constructions = 0;
      /** Increments the construction count for the sharing assertion. */
      public constructor() {
        Counted.constructions += 1;
      }
    }
    /** Module owning and exporting Counted. */
    class Source {}
    Module({ providers: [Counted], exports: [Counted] })(Source);
    /** First importing module for Source. */
    class A {}
    /** Second importing module for Source. */
    class B {}
    Module({ imports: [Source] })(A);
    Module({ imports: [Source] })(B);
    /** Root importing Source through both branches. */
    class Root {}
    Module({ imports: [A, B, Source] })(Root);
    const container = await GlacierContainer.create(Root);

    container.select(A).get(Counted);
    container.select(B).get(Counted);
    container.get(Counted);

    expect(Counted.constructions).toBe(1);
  });
});
