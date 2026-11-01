import { ContainerError } from "./ContainerError.error.js";

/** Groups all validation problems from one container operation without discarding their original errors. */
export class AggregateContainerError extends ContainerError {
  /** Every collected failure, in discovery order; none is dropped or replaced. */
  public readonly causes: readonly Error[];

  /**
   * Constructs a grouped validation failure whose message and causes preserve discovery order.
   * @param causes Errors to report in order; a defensive frozen copy is retained.
   */
  public constructor(causes: readonly Error[]) {
    const lines = causes.map((cause) => `- ${cause.message}`);
    super(`Container failed with ${causes.length} error(s):\n${lines.join("\n")}`);
    this.causes = Object.freeze([...causes]);
  }
}
