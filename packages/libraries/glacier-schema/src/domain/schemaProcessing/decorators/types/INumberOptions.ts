import type { INumberRules } from "../../schema/types/INumberRules.js";
import type { ISchemaDecoratorOptions } from "./ISchemaDecoratorOptions.js";

/** Combined issue-message and numeric constraints accepted by `IsNumber` and `IsInt`. */
export interface INumberOptions extends ISchemaDecoratorOptions, INumberRules {}
