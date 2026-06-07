import { Optional } from '@glacier/utils';

import { EnvValueSchema } from './interfaces/EnvValueSchema';
import { InferEnvValueSchema } from './interfaces/InferEnvValueSchema';
import { EnvValueType } from './interfaces/EnvValueType';
import { MissingEnvironment } from './exception/MissingEnvironment';

/**
 * The Environment class provides type-safe access to environment variables
 * using a schema-based approach for parsing and validation.
 */
export abstract class Environment {
  /**
   * Retrieves and parses an environment variable according to the provided schema.
   * @param schema The schema describing the environment variable.
   * @returns The parsed and validated value, or undefined if not present or invalid.
   */
  public get<const S extends EnvValueSchema>(schema: S): Optional<InferEnvValueSchema<S>> {
    const value = process.env[schema.key];
    if (typeof value === 'undefined') return;
    const inferredValue = this.inferValue(schema, value);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion --- TypeScript can not infer conditional types here
    return inferredValue as InferEnvValueSchema<S>;
  }

  public getOrThrow<const S extends EnvValueSchema>(schema: S): InferEnvValueSchema<S> {
    const value = this.get(schema);
    if (typeof value === 'undefined') {
      throw new MissingEnvironment(`Missing environment variable: ${schema.key}`);
    }
    return value;
  }

  private inferValue(schema: EnvValueSchema, value: string) {
    if (schema.isArray) {
      const items = value.split(',').map((v) => v.trim());
      return items.map((v) => this.inferType(schema.type, v));
    }
    return this.inferType(schema.type, value);
  }

  private inferType(type: EnvValueType, value: string) {
    if (type === 'number') return parseFloat(value);
    if (type === 'boolean') return value === 'true' || value === '1';
    return value;
  }
}
