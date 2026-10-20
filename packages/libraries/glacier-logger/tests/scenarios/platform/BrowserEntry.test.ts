// @scenario PLT-002
import { describe, expect, it } from "vitest";
import * as entry from "../../../index.browser.js";

describe("browser entry point", () => {
  it("exposes the console transport and no Node-only transport", () => {
    expect(entry.BrowserConsoleTransport).toBeTypeOf("function");
    expect(entry.LoggerFactory).toBeTypeOf("function");
    const exposed = Object.keys(entry);
    expect(exposed).not.toContain("NodeFileTransport");
    expect(exposed).not.toContain("NodeStdoutTransport");
  });
});
