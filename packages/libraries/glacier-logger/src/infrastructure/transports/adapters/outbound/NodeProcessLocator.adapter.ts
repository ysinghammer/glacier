import type { IProcessHost } from "../../../../application/transports/ports/outbound/IProcessHost.port.js";

/** Locates and validates the global process host required by Node-specific transports. */
export class NodeProcessLocator {
  /**
   * Returns the global Node process after checking the members used by these transports.
   * @returns The validated running Node process host.
   * @throws Error when no compatible Node process exists; supply a host or use console output.
   */
  public static require(): IProcessHost {
    const candidate: unknown = Reflect.get(globalThis, "process");
    if (!NodeProcessLocator.isProcessHost(candidate)) {
      throw new Error(
        "Node transports need a Node.js process. Use the console transport in browsers.",
      );
    }
    return candidate;
  }

  /**
   * Narrows an unknown global value to the process operations required by the adapters.
   * @param value Unknown value read from the global `process` property.
   * @returns Whether the value has the process members checked by Node transports.
   */
  private static isProcessHost(value: unknown): value is IProcessHost {
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
