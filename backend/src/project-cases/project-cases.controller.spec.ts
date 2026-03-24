import { Test, TestingModule } from '@nestjs/testing';
import { ProjectCasesController } from './project-cases.controller';

describe('ProjectCasesController', () => {
  let controller: ProjectCasesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectCasesController],
    }).compile();

    controller = module.get<ProjectCasesController>(ProjectCasesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
