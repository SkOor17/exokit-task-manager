import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { TimersService } from './timers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StartTimerDto } from './dto/start-timer.dto';
import { StopTimerDto } from './dto/stop-timer.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@Controller('timers')
@UseGuards(JwtAuthGuard)
export class TimersController {
  constructor(private readonly timersService: TimersService) {}

  @Post('start')
  startTimer(@Body() startTimerDto: StartTimerDto, @CurrentUser() user: User) {
    return this.timersService.startTimer(
      startTimerDto.taskId,
      user.id,
      startTimerDto.timeType,
    );
  }

  @Post(':id/pause')
  pauseTimer(@Param('id') timerId: string, @CurrentUser() user: User) {
    return this.timersService.pauseTimer(timerId, user.id);
  }

  @Post(':id/stop')
  stopTimer(
    @Param('id') timerId: string,
    @Body() stopTimerDto: StopTimerDto,
    @CurrentUser() user: User,
  ) {
    return this.timersService.stopTimer(timerId, user.id, stopTimerDto.notes);
  }

  @Get('active')
  getActiveTimer(@CurrentUser() user: User) {
    return this.timersService.getActiveTimer(user.id);
  }

  @Get('task/:taskId')
  getTaskTimers(@Param('taskId') taskId: string) {
    return this.timersService.getTaskTimers(taskId);
  }
}
