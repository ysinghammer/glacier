// @scenario IOC-001
import { describe, expect, it } from "vitest";
import {
  CircularDependencyError,
  InjectionToken,
  UnknownDependencyError,
  type IToken,
} from "../../../index.js";

describe("IOC-001 token identity and descriptions", () => {
  it("creates distinct symbols for tokens with equal descriptions", () => {
    const first = new InjectionToken<string>("config");
    const second = new InjectionToken<string>("config");

    expect(first.symbol).not.toBe(second.symbol);
    expect(first.description).toBe("config");
    expect(typeof first.symbol).toBe("symbol");
  });

  it("shows the injection token description in error text", () => {
    const token = new InjectionToken<number>("database-port");

    const error = new UnknownDependencyError([token]);

    expect(error.message).toBe("Unknown dependency: InjectionToken(database-port)");
  });

  it("describes classes, anonymous classes and symbols along a dependency path", () => {
    class Service {}
    const anonymous = (() => class {})();
    const labelled: IToken = Symbol("labelled");

    const error = new CircularDependencyError([Service, anonymous, labelled, Service]);

    expect(error.message).toBe(
      "Circular dependency: Service -> <anonymous class> -> Symbol(labelled) -> Service",
    );
  });
});
