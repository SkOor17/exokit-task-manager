import { Test, TestingModule } from '@nestjs/testing';
import { ProjectCasesService } from './project-cases.service';

describe('ProjectCasesService', () => {
  let service: ProjectCasesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectCasesService],
    }).compile();

    service = module.get<ProjectCasesService>(ProjectCasesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
