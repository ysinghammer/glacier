import { ApplicationModule } from './Application.module.js';

const app = await ApplicationModule.create();
await app.listen(8080);
