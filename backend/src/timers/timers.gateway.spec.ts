import { Test, TestingModule } from '@nestjs/testing';
import { TimersGateway } from './timers.gateway';

describe('TimersGateway', () => {
  let gateway: TimersGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TimersGateway],
    }).compile();

    gateway = module.get<TimersGateway>(TimersGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
