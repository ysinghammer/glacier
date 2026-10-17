// @scenario IOC-015
// @scenario IOC-016
import { describe, expect, it } from "vitest";
import {
  GlacierContainer,
  InvalidModuleError,
  Module,
  UnknownDependencyError,
} from "../../../index.js";

class Private {}
class Public {}

class Inner {}
Module({ providers: [Private, Public], exports: [Public] })(Inner);

class Outer {}
Module({ imports: [Inner] })(Outer);

describe("IOC-015 strict and non-strict lookup", () => {
  it("restricts a strict lookup to what the selected module sees", () => {
    const container = GlacierContainer.create(Outer);

    expect(container.get(Public, { strict: true })).toBeInstanceOf(Public);
    expect(() => container.get(Private, { strict: true })).toThrow(UnknownDependencyError);
    expect(() => container.select(Outer).get(Private)).toThrow(UnknownDependencyError);
  });

  it("searches the whole container when strict is false", () => {
    const container = GlacierContainer.create(Outer);

    expect(container.get(Private)).toBeInstanceOf(Private);
    expect(container.get(Private, { strict: false })).toBeInstanceOf(Private);
    expect(container.select(Outer).get(Private, { strict: false })).toBe(container.get(Private));
  });

  it("selects any reachable module and sees its own private providers", () => {
    const container = GlacierContainer.create(Outer);

    expect(container.select(Inner).get(Private)).toBe(container.get(Private));
  });

  it("prefers what the root sees over an unrelated module's provider of the same token", () => {
    class Shadowed {}
    class Other {}
    Module({ providers: [Shadowed] })(Other);
    class Root {}
    Module({ imports: [Other], providers: [Shadowed] })(Root);
    const container = GlacierContainer.create(Root);

    expect(container.get(Shadowed)).toBe(container.select(Root).get(Shadowed));
    expect(container.get(Shadowed)).not.toBe(container.select(Other).get(Shadowed));
  });

  it("rejects selecting a module that is not part of the container", () => {
    class Stranger {}
    Module({})(Stranger);

    expect(() => GlacierContainer.create(Outer).select(Stranger)).toThrow(InvalidModuleError);
    expect(() => GlacierContainer.create(Outer).select({ module: Stranger })).toThrow(
      /Stranger.*not part of this container/,
    );
  });

  it("reports an unknown token with no match anywhere", () => {
    expect(() => GlacierContainer.create(Outer).get(Symbol("absent"))).toThrow(
      UnknownDependencyError,
    );
  });
});

describe("IOC-016 module de-duplication", () => {
  it("creates one module instance and one provider instance when imported twice", () => {
    class Left {}
    class Right {}
    Module({ imports: [Inner] })(Left);
    Module({ imports: [Inner, Inner] })(Right);
    class Root {}
    Module({ imports: [Left, Right, Inner] })(Root);
    const container = GlacierContainer.create(Root);

    const viaLeft = container.select(Left).get(Public);
    const viaRight = container.select(Right).get(Public);

    expect(viaLeft).toBe(viaRight);
    expect(container.select(Inner)).toBeDefined();
    expect(container.get(Public)).toBe(viaLeft);
  });

  it("shares one instance of a provider exported through several importers", () => {
    class Counted {
      static constructions = 0;
      public constructor() {
        Counted.constructions += 1;
      }
    }
    class Source {}
    Module({ providers: [Counted], exports: [Counted] })(Source);
    class A {}
    class B {}
    Module({ imports: [Source] })(A);
    Module({ imports: [Source] })(B);
    class Root {}
    Module({ imports: [A, B, Source] })(Root);
    const container = GlacierContainer.create(Root);

    container.select(A).get(Counted);
    container.select(B).get(Counted);
    container.get(Counted);

    expect(Counted.constructions).toBe(1);
  });
});
