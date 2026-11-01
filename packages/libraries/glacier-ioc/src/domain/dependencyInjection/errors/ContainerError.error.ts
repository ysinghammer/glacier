import type { IContainerErrorOptions } from "./IContainerErrorOptions.js";

/** Base exceptional container error; subclasses retain their class name and optional cause. */
export class ContainerError extends Error {
  /**
   * Constructs a named container failure with an optional preserved cause.
   * @param message Diagnostic message exposed through `Error.message`.
   * @param options Optional underlying cause, preserved as `Error.cause`.
   */
  public constructor(message: string, options?: IContainerErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}
