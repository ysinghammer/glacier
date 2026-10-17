import { expect, it } from "vitest";
import { NativeActivationProbe } from "../data/NativeActivationProbe.js";

it("rejects null Reflect and preserves the arranged platform descriptor", () => {
  expect(NativeActivationProbe.run("null")).toBe("passed");
});
