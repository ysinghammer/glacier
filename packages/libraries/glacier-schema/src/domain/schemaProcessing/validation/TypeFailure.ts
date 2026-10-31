import type { IValueFailure } from "./types/IValueFailure.js";
import { ReceivedType } from "./ReceivedType.js";

/** Builds the standard rejection of a value of the wrong type. */
export class TypeFailure {
  /**
   * Builds an `invalid_type` failure describing the expected and received categories.
   * @param expected Human-readable expected type label.
   * @param value Rejected runtime value.
   * @returns Failure with expected and received labels; no input is mutated.
   */
  public static invalidType(expected: string, value: unknown): IValueFailure {
    const received = ReceivedType.describe(value);
    return {
      code: "invalid_type",
      message: `Expected ${expected}, received ${received}`,
      params: { expected, received },
    };
  }
}
