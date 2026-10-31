import type { ISizeRules } from "../schema/ISizeRules.js";
import type { ISchemaDecoratorOptions } from "./ISchemaDecoratorOptions.js";

/** Options of `IsMap` and `IsRecord`: the shared `message` plus `min` and `max` entry counts. */
export interface ISizeOptions extends ISchemaDecoratorOptions, ISizeRules {}
