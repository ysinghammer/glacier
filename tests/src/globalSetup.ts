import { resolve } from 'node:path';
import {
  GenericContainer,
  Network,
  type StartedNetwork,
  type StartedTestContainer,
  Wait
} from 'testcontainers';

const databaseName = 'glacier';
const databaseUser = 'glacier';
const databasePassword = 'glacier';

export default async function globalSetup() {
  const repositoryRoot = resolve(import.meta.dirname, '../..');
  let network: StartedNetwork | undefined;
  let database: StartedTestContainer | undefined;
  let application: StartedTestContainer | undefined;

  try {
    network = await new Network().start();

    database = await new GenericContainer('postgres:16-alpine')
      .withNetwork(network)
      .withNetworkAliases('postgres')
      .withEnvironment({
        POSTGRES_DB: databaseName,
        POSTGRES_USER: databaseUser,
        POSTGRES_PASSWORD: databasePassword
      })
      .withWaitStrategy(Wait.forLogMessage(/database system is ready to accept connections/))
      .start();

    const applicationImage = await GenericContainer.fromDockerfile(
      repositoryRoot,
      'applications/glacier-backend-core/Dockerfile'
    )
      .withCache(true)
      .build();

    application = await applicationImage
      .withNetwork(network)
      .withEnvironment({
        GLACIER_DATABASE_URL: `postgresql://${databaseUser}:${databasePassword}@postgres:5432/${databaseName}`
      })
      .withExposedPorts({ container: 8080, host: 8080 })
      .withWaitStrategy(Wait.forHttp('/v1/management/health', 8080).forStatusCode(200))
      .start();
  } catch (error) {
    await application?.stop();
    await database?.stop();
    await network?.stop();
    throw error;
  }

  return async () => {
    await application?.stop();
    await database?.stop();
    await network?.stop();
  };
}
