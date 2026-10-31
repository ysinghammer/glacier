/** Indicates whether the current Vitest project exposes a Node process runtime. */
export const IS_NODE: boolean =
  typeof Reflect.get(globalThis, "process")?.versions?.node === "string";
