import { expect, it } from "vitest";
import { NativeActivationProbe } from "../data/NativeActivationProbe.js";

it("preserves throwing Reflect access and its cause without leaking its message", () => {
  expect(NativeActivationProbe.run("throwing")).toBe("passed");
});
