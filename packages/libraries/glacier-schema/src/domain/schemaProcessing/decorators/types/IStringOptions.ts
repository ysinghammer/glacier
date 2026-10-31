import type { IStringRules } from "../../schema/types/IStringRules.js";
import type { ISchemaDecoratorOptions } from "./ISchemaDecoratorOptions.js";

/** Combined issue-message, constraints and normalisations accepted by `IsString`. */
export interface IStringOptions extends ISchemaDecoratorOptions, IStringRules {}
