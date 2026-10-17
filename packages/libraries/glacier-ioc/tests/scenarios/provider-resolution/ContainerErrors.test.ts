// @scenario IOC-002
import { describe, expect, it } from "vitest";
import {
  AggregateContainerError,
  CircularDependencyError,
  ContainerError,
  ContextIdMisuseError,
  InvalidProviderError,
  InvalidScopeError,
  UnknownDependencyError,
  UseAfterCloseError,
} from "../../../index.js";

class Repository {}
class Service {}

describe("IOC-002 container error hierarchy", () => {
  it.each([
    ["UnknownDependencyError", new UnknownDependencyError([Service, Repository])],
    ["CircularDependencyError", new CircularDependencyError([Service, Repository, Service])],
    ["InvalidScopeError", new InvalidScopeError([Service], "scope mismatch")],
    ["InvalidProviderError", new InvalidProviderError(Service, "no provider kind")],
    ["ContextIdMisuseError", new ContextIdMisuseError("unknown context")],
    ["UseAfterCloseError", new UseAfterCloseError("resolve Service")],
    ["AggregateContainerError", new AggregateContainerError([new Error("one")])],
  ])("%s is a ContainerError and an Error carrying its own name", (name, error) => {
    expect(error).toBeInstanceOf(ContainerError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe(name);
  });

  it("includes the dependency path in path-carrying messages", () => {
    expect(new UnknownDependencyError([Service, Repository]).message).toBe(
      "Unknown dependency: Service -> Repository",
    );
    expect(new InvalidScopeError([Service, Repository], "request in default").message).toBe(
      "Invalid scope: Service -> Repository: request in default",
    );
    expect(new InvalidProviderError(Service, "missing factory").message).toBe(
      "Invalid provider Service: missing factory",
    );
    expect(new ContextIdMisuseError("reused").message).toBe("Context id misuse: reused");
    expect(new UseAfterCloseError("get Service").message).toBe(
      "Container is closed; cannot get Service",
    );
  });

  it("exposes frozen copies of the dependency path and offending token", () => {
    const path = [Service, Repository];

    const unknown = new UnknownDependencyError(path);
    const circular = new CircularDependencyError(path);
    const scope = new InvalidScopeError(path, "reason");
    path.push(Service);

    expect(unknown.dependencyPath).toEqual([Service, Repository]);
    expect(circular.dependencyPath).toEqual([Service, Repository]);
    expect(scope.dependencyPath).toEqual([Service, Repository]);
    expect(Object.isFrozen(unknown.dependencyPath)).toBe(true);
    expect(new InvalidProviderError(Service, "reason").token).toBe(Service);
  });

  it("preserves a supplied cause and omits it otherwise", () => {
    const cause = new Error("root");

    const wrapped = new UnknownDependencyError([Service], { cause });
    const plain = new UnknownDependencyError([Service]);

    expect(wrapped.cause).toBe(cause);
    expect(Object.hasOwn(plain, "cause")).toBe(false);
    expect(new CircularDependencyError([Service], { cause }).cause).toBe(cause);
    expect(new InvalidScopeError([Service], "r", { cause }).cause).toBe(cause);
    expect(new InvalidProviderError(Service, "r", { cause }).cause).toBe(cause);
    expect(new ContextIdMisuseError("r", { cause }).cause).toBe(cause);
    expect(new UseAfterCloseError("r", { cause }).cause).toBe(cause);
  });

  it("keeps every cause of an aggregate in order and lists them in its message", () => {
    const first = new UnknownDependencyError([Service]);
    const second = new CircularDependencyError([Service, Repository, Service]);
    const third = new Error("plain failure");

    const aggregate = new AggregateContainerError([first, second, third]);

    expect(aggregate.causes).toEqual([first, second, third]);
    expect(aggregate.causes[1]).toBe(second);
    expect(Object.isFrozen(aggregate.causes)).toBe(true);
    expect(aggregate.message).toBe(
      [
        "Container failed with 3 error(s):",
        "- Unknown dependency: Service",
        "- Circular dependency: Service -> Repository -> Service",
        "- plain failure",
      ].join("\n"),
    );
  });
});
