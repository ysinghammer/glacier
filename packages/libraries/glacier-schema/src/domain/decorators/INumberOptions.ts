import type { INumberRules } from "../schema/INumberRules.js";
import type { ISchemaDecoratorOptions } from "./ISchemaDecoratorOptions.js";

/** Options of `IsNumber` and `IsInt`: the shared `message` plus the numeric constraints. */
export interface INumberOptions extends ISchemaDecoratorOptions, INumberRules {}
