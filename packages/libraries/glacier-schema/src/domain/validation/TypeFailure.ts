import type { IValueFailure } from "./IValueFailure.js";
import { ReceivedType } from "./ReceivedType.js";

/** Builds the standard rejection of a value of the wrong type. */
export class TypeFailure {
  /** Returns an `invalid_type` failure naming what was `expected` and what `value` actually is. */
  public static invalidType(expected: string, value: unknown): IValueFailure {
    const received = ReceivedType.describe(value);
    return {
      code: "invalid_type",
      message: `Expected ${expected}, received ${received}`,
      params: { expected, received },
    };
  }
}
