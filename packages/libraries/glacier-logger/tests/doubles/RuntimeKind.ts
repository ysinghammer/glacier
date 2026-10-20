/** True when the test runs on Node, false in the browser project. */
export const IS_NODE: boolean =
  typeof Reflect.get(globalThis, "process")?.versions?.node === "string";
