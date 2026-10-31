/** Strict CLI bounds keep malformed load configuration from silently changing a run. */
export class BenchmarkArguments {
  /** Accepts positive decimal safe integers only. */
  public static positive(value: string | undefined, name: string): number {
    if (value === undefined || !/^[1-9][0-9]*$/.test(value)) throw new Error(`Invalid ${name}`);
    const number = Number(value);
    if (!Number.isSafeInteger(number)) throw new Error(`Invalid ${name}`);
    return number;
  }
}
