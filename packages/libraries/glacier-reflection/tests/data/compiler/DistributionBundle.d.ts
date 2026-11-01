declare module "*bundle/retained.js" {
  /** Exposes whether the retained bundle entry evaluated compiler registration. */
  export class DistributionRetained {
    /** Readonly handler state observed in the generated bundle's realm. */
    public static readonly hasCompilerHandler: boolean;
  }
}

declare module "*bundle/retained-observer.js" {
  /** Exposes public metadata observations for the retained entry's class. */
  export class DistributionOrdinaryMetadata {
    /**
     * Reads compiler metadata and definition identity for a target class.
     * @param target Constructable target whose emitted record is observed.
     * @returns Public compiler record, frozen-state, and identity observations.
     */
    public static compilerRecord(
      target: Function & {
        /** Readonly prototype object identifying this function as a constructor. */
        readonly prototype: object;
      },
    ): unknown;
  }
}

declare module "*bundle/root-only.js" {
  /** Exposes the current Reflect metadata descriptor from the root-only bundle. */
  export class DistributionRootOnly {
    /**
     * Returns the own descriptor without evaluating a possible accessor.
     * @returns Current descriptor, or `undefined` when absent.
     */
    public static descriptor(): PropertyDescriptor | undefined;
  }
}

declare module "*bundle/ordinary-metadata.js" {
  /** Exposes manual metadata observations from the ordinary root bundle. */
  export class DistributionOrdinaryMetadata {
    /**
     * Reports manual metadata and inactive root registration state.
     * @returns Public API observations for the fixture consumer.
     */
    public static observations(): unknown;
  }
}

declare module "*bundle/shared-metadata.js" {
  /** Exposes metadata identity and construction observations from the shared bundle. */
  export class DistributionSharedMetadata {
    /**
     * Reports emitted records, definition identities, and construction count.
     * @returns Public API observations from the bundle graph.
     */
    public static observations(): unknown;
  }
}
