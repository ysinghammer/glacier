/** Lifetime of a provider instance: one per container, one per resolution, or one per context id. */
export type IProviderScope = "default" | "transient" | "request";
