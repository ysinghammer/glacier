import { expect, it } from "vitest";
import { NativeActivationProbe } from "../data/NativeActivationProbe.js";

it("rejects unavailable Reflect and preserves the arranged platform descriptor", () => {
  expect(NativeActivationProbe.run("unavailable")).toBe("passed");
});
