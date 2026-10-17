import { expect, it } from "vitest";
import { NativeActivationProbe } from "../data/NativeActivationProbe.js";

it("imports root with absent Reflect then rejects registration without changing the absent descriptor", () => {
  expect(NativeActivationProbe.run("absent")).toBe("passed");
});
