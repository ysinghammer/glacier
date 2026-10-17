import { ContainerError } from "./ContainerError.error.js";

/** Reports every problem found by one operation, such as eager graph validation, at once. */
export class AggregateContainerError extends ContainerError {
  /** Every collected failure, in discovery order; none is dropped or replaced. */
  readonly causes: readonly Error[];

  /** Creates the error; its message lists each cause and `causes` keeps the originals. */
  public constructor(causes: readonly Error[]) {
    const lines = causes.map((cause) => `- ${cause.message}`);
    super(`Container failed with ${causes.length} error(s):\n${lines.join("\n")}`);
    this.causes = Object.freeze([...causes]);
  }
}
