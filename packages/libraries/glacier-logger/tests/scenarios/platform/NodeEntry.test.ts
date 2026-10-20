// @scenario PLT-001
import { describe, expect, it } from "vitest";
import * as entry from "../../../index.js";
import { IS_NODE } from "../../doubles/RuntimeKind.js";

describe("node entry point", () => {
  it.runIf(IS_NODE)("exposes the file and stdout transports and no console transport", () => {
    expect(entry.NodeFileTransport).toBeTypeOf("function");
    expect(entry.NodeStdoutTransport).toBeTypeOf("function");
    expect(entry.LoggerFactory).toBeTypeOf("function");
    expect(Object.keys(entry)).not.toContain("BrowserConsoleTransport");
  });
});
