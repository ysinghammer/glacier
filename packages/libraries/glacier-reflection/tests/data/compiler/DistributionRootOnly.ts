import "@glacier/reflection";

/** Observes a side-effect-only root entry without evaluating a foreign metadata accessor. */
export class DistributionRootOnly {
  /** Returns the actual descriptor for comparison in the executing native realm. */
  public static descriptor(): PropertyDescriptor | undefined {
    return Object.getOwnPropertyDescriptor(Reflect, "metadata");
  }
}
