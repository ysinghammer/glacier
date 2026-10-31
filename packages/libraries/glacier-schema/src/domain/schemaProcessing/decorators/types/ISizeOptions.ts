import type { ISizeRules } from "../../schema/types/ISizeRules.js";
import type { ISchemaDecoratorOptions } from "./ISchemaDecoratorOptions.js";

/** Combined issue-message and entry-count constraints accepted by `IsMap` and `IsRecord`. */
export interface ISizeOptions extends ISchemaDecoratorOptions, ISizeRules {}
