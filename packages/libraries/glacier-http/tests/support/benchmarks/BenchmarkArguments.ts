/** Strict CLI bounds keep malformed load configuration from silently changing a run. */
export class BenchmarkArguments {
  /**
   * Parses a positive base-10 safe integer from a CLI argument.
   * @param value Raw argument; required and must contain positive decimal digits only.
   * @param name Argument name included in validation failures.
   * @returns Parsed positive safe integer.
   * @throws {Error} When the value is absent, malformed, zero, or unsafe.
   */
  public static positive(value: string | undefined, name: string): number {
    if (value === undefined || !/^[1-9][0-9]*$/.test(value)) throw new Error(`Invalid ${name}`);
    const number = Number(value);
    if (!Number.isSafeInteger(number)) throw new Error(`Invalid ${name}`);
    return number;
  }
}
