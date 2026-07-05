import { Module } from '@nestjs/common';

import { PresentationModule } from './presentation/Presentation.module.js';

@Module({ imports: [PresentationModule] })
export class ManagementModule {}
