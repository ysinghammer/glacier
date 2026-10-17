import type { IProvider } from "../domain/providers/IProvider.js";

/**
 * The single-module graph accepted by `GlacierContainer.create` until `@Module` classes arrive:
 * every provider declared here is visible to every lookup.
 */
export interface IContainerRoot {
  /** Providers registered in the container; a later provider for the same token replaces an earlier one. */
  readonly providers: readonly IProvider[];
}
