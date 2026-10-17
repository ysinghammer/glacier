import type { IStringRules } from "../schema/IStringRules.js";
import type { ISchemaDecoratorOptions } from "./ISchemaDecoratorOptions.js";

/** Options of `IsString`: the shared `message` plus the string constraints and normalisations. */
export interface IStringOptions extends ISchemaDecoratorOptions, IStringRules {}
