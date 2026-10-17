import type { ICollectionRules } from "../schema/ICollectionRules.js";
import type { ISchemaDecoratorOptions } from "./ISchemaDecoratorOptions.js";

/** Options of `IsArray` and `IsSet`: the shared `message` plus `min`, `max` and `unique`. */
export interface ICollectionOptions extends ISchemaDecoratorOptions, ICollectionRules {}
