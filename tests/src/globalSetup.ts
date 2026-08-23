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

async function timeSetupStep<T>(name: string, action: () => Promise<T>): Promise<T> {
  const label = `[global setup] ${name}`;
  console.time(label);

  try {
    return await action();
  } finally {
    console.timeEnd(label);
  }
}

export default async function globalSetup() {
  const repositoryRoot = resolve(import.meta.dirname, '../..');
  let network: StartedNetwork | undefined;
  let database: StartedTestContainer | undefined;
  let application: StartedTestContainer | undefined;

  try {
    const startedNetwork = await timeSetupStep('create Docker network', () =>
      new Network().start()
    );
    network = startedNetwork;

    database = await timeSetupStep('start PostgreSQL', () =>
      new GenericContainer('postgres:16-alpine')
        .withNetwork(startedNetwork)
        .withNetworkAliases('postgres')
        .withEnvironment({
          POSTGRES_DB: databaseName,
          POSTGRES_USER: databaseUser,
          POSTGRES_PASSWORD: databasePassword
        })
        .withWaitStrategy(Wait.forLogMessage(/database system is ready to accept connections/, 2))
        .start()
    );

    const prismaImage = await timeSetupStep('build Prisma image', () =>
      GenericContainer.fromDockerfile(
        resolve(repositoryRoot, './applications/glacier-backend-core'),
        'Dockerfile-prisma'
      )
        .withCache(true)
        .build()
    );

    await timeSetupStep('run Prisma migrations', () =>
      prismaImage
        .withNetwork(startedNetwork)
        .withEnvironment({
          GLACIER_DATABASE_URL: `postgresql://${databaseUser}:${databasePassword}@postgres:5432/${databaseName}`
        })
        .withWaitStrategy(Wait.forOneShotStartup())
        .start()
    );

    const applicationImage = await timeSetupStep('build application image', () =>
      GenericContainer.fromDockerfile(
        resolve(repositoryRoot, './applications/glacier-backend-core'),
        'Dockerfile'
      )
        .withCache(true)
        .build()
    );

    application = await timeSetupStep('start application', () =>
      applicationImage
        .withNetwork(startedNetwork)
        .withEnvironment({
          GLACIER_DATABASE_URL: `postgresql://${databaseUser}:${databasePassword}@postgres:5432/${databaseName}`
        })
        .withExposedPorts({ container: 8080, host: 8080 })
        .withWaitStrategy(Wait.forHttp('/v1/management/health', 8080).forStatusCode(200))
        .start()
    );
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
