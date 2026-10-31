import type { IConstructorDependency } from "../metadata/types/IConstructorDependency.js";
import { InjectionMetadata } from "../metadata/InjectionMetadata.js";
import type { ITokenReference } from "../tokens/types/ITokenReference.js";
import { TokenIdentity } from "../tokens/TokenIdentity.js";
import type { IProviderRegistration } from "./types/IProviderRegistration.js";

/** Derives the ordered dependencies required to create a registered provider. */
export class ProviderDependencies {
  /**
   * Reads dependencies from the provider form; value providers require none.
   * @param registration Registration whose normalized provider is inspected.
   * @returns Dependencies in resolution argument order.
   */
  public static of(registration: IProviderRegistration): readonly IConstructorDependency[] {
    const { provider } = registration;
    if ("useValue" in provider) return [];
    if ("useExisting" in provider) return [ProviderDependencies.required(0, provider.useExisting)];
    if ("useFactory" in provider) {
      return (provider.inject ?? []).map((token, position) =>
        ProviderDependencies.required(position, token),
      );
    }
    return InjectionMetadata.readDependencies(provider.useClass);
  }

  /**
   * Creates a required dependency entry using normalized token identity.
   * @param position Zero-based dependency position.
   * @param token Token reference requested at that position.
   * @returns Non-optional constructor dependency record.
   */
  private static required(position: number, token: ITokenReference): IConstructorDependency {
    return { position, token: TokenIdentity.of(token), isOptional: false };
  }
}
