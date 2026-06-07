import { Environment, EnvValueSchema } from '../../src';

export function fakeEnvClass() {
  return new (class FakeEnvClass extends Environment {
    public proxyGet(schema: EnvValueSchema) {
      return this.get(schema);
    }

    public proxyGetOrThrow(schema: EnvValueSchema) {
      return this.getOrThrow(schema);
    }
  })();
}
