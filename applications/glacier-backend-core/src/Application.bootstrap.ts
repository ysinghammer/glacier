import { ApplicationModule } from './Application.module.js';

const app = await ApplicationModule.create();
await app.listen(Number.parseInt(process.env['PORT'] ?? '8080', 10));
const shutdown = () => void app.close().finally(() => process.exit(0));
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
