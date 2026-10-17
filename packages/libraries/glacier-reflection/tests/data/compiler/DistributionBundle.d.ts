declare module "*bundle/retained.js" {
  export class DistributionRetained {
    public static readonly hasCompilerHandler: boolean;
  }
}

declare module "*bundle/retained-observer.js" {
  export class DistributionOrdinaryMetadata {
    public static compilerRecord(target: Function & { readonly prototype: object }): unknown;
  }
}

declare module "*bundle/root-only.js" {
  export class DistributionRootOnly {
    public static descriptor(): PropertyDescriptor | undefined;
  }
}

declare module "*bundle/ordinary-metadata.js" {
  export class DistributionOrdinaryMetadata {
    public static observations(): unknown;
  }
}

declare module "*bundle/shared-metadata.js" {
  export class DistributionSharedMetadata {
    public static observations(): unknown;
  }
}
