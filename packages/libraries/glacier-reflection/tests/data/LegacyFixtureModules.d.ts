/** Types genuine emitted fixture imports without asking Vitest to transform their source. */
declare module "*artifacts/compiler/LegacyLocations.js" {
  export const LegacyLocations: typeof import("./compiler/LegacyLocations.js").LegacyLocations;
}
/** Types the genuinely compiled documentation consumer without transforming its source. */
declare module "*artifacts/compiler/AdoptionExample.js" {
  export const AdoptionExample: typeof import("./compiler/AdoptionExample.js").AdoptionExample;
}
