import type { IJsonObject } from "./IJsonObject.js";

/** Readonly JSON tree; finite numbers and safe data descriptors are enforced at runtime. */
export type IJsonValue = null | boolean | number | string | IJsonObject | readonly IJsonValue[];
