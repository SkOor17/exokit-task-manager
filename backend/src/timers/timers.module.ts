import { Module } from '@nestjs/common';
import { TimersService } from './timers.service';
import { TimersGateway } from './timers.gateway';
import { TimersController } from './timers.controller';

@Module({
  providers: [TimersService, TimersGateway],
  controllers: [TimersController],
})
export class TimersModule {}
