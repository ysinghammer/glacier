import type { IProcessHost } from "../../../application/ports/outbound/IProcessHost.port.js";

/** Finds the Node `process` object, when there is one. */
export class NodeProcessLocator {
  /**
   * Returns the running Node process.
   * @throws Error outside Node, where the Node transports cannot work; pass a host explicitly or use the console transport.
   */
  static require(): IProcessHost {
    const candidate: unknown = Reflect.get(globalThis, "process");
    if (!NodeProcessLocator.#isProcessHost(candidate)) {
      throw new Error(
        "Node transports need a Node.js process. Use the console transport in browsers.",
      );
    }
    return candidate;
  }

  static #isProcessHost(value: unknown): value is IProcessHost {
    return (
      value instanceof Object &&
      typeof Reflect.get(value, "pid") === "number" &&
      Reflect.get(value, "stdout") instanceof Object &&
      typeof Reflect.get(value, "on") === "function" &&
      typeof Reflect.get(value, "off") === "function" &&
      typeof Reflect.get(value, "listenerCount") === "function" &&
      typeof Reflect.get(value, "kill") === "function"
    );
  }
}
