import type { IConstructorDependency } from "../metadata/IConstructorDependency.js";
import { InjectionMetadata } from "../metadata/InjectionMetadata.js";
import type { ITokenReference } from "../tokens/ITokenReference.js";
import { TokenIdentity } from "../tokens/TokenIdentity.js";
import type { IProviderRegistration } from "./IProviderRegistration.js";

/** Lists what a registered provider needs in order to be constructed. */
export class ProviderDependencies {
  /** Returns the dependencies of the provider; a validated class provider reads its constructor metadata. */
  public static of(registration: IProviderRegistration): readonly IConstructorDependency[] {
    const { provider } = registration;
    if ("useValue" in provider) return [];
    if ("useExisting" in provider) return [ProviderDependencies.#required(0, provider.useExisting)];
    if ("useFactory" in provider) {
      return (provider.inject ?? []).map((token, position) =>
        ProviderDependencies.#required(position, token),
      );
    }
    return InjectionMetadata.readDependencies(provider.useClass);
  }

  static #required(position: number, token: ITokenReference): IConstructorDependency {
    return { position, token: TokenIdentity.of(token), isOptional: false };
  }
}
