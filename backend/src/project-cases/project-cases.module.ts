import { Module } from '@nestjs/common';
import { ProjectCasesService } from './project-cases.service';
import { ProjectCasesController } from './project-cases.controller';

@Module({
  providers: [ProjectCasesService],
  controllers: [ProjectCasesController]
})
export class ProjectCasesModule {}
