import "@glacier/reflection";

/** Observes a side-effect-only root entry without evaluating a foreign metadata accessor. */
export class DistributionRootOnly {
  /**
   * Returns the actual metadata-handler descriptor without evaluating it.
   * @returns The current own descriptor, or `undefined` when absent.
   */
  public static descriptor(): PropertyDescriptor | undefined {
    return Object.getOwnPropertyDescriptor(Reflect, "metadata");
  }
}
