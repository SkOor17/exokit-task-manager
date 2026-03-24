import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TimersService } from './timers.service';
import { TimeType } from '@prisma/client';

@WebSocketGateway({
  cors: {
    origin: '*', // TODO: À restreindre en production (ex: process.env.CORS_ORIGIN)
    credentials: true,
  },
})
export class TimersGateway {
  @WebSocketServer()
  server!: Server;

  constructor(private timersService: TimersService) {}

  /**
   * Handles the 'timer:start' WebSocket event. Starts a timer for a given task and user, and emits the updated timer to all connected clients.
   * Checks that the task exists and that there is no already active timer for the user. If the task is in TODO or PAUSED status, it will be set to IN_PROGRESS.
   * @param data - Object containing taskId, userId, and optional timeType for the timer
   * @param client - The WebSocket client that sent the event
   * @returns An object indicating success and containing the started timer, or an error message if an error occurred
   * @throws NotFoundException if the task does not exist
   * @throws BadRequestException if the user already has an active timer
   */
  @SubscribeMessage('timer:start')
  async handleStartTimer(
    @MessageBody()
    data: { taskId: string; userId: string; timeType?: TimeType },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const timer = await this.timersService.startTimer(
        data.taskId,
        data.userId,
        data.timeType,
      );

      // Émettre à tous les clients connectés
      this.server.emit('timer:started', timer);

      return { success: true, timer };
    } catch (error: any) {
      return this.handleError(client, error);
    }
  }

  /**
   * Handles the 'timer:pause' WebSocket event. Pauses or resumes a timer based on its current state, and emits the updated timer to all connected clients.
   * Checks that the timer exists, belongs to the user, and is not already finished.
   * @param data - Object containing timerId and userId to identify which timer to pause/resume
   * @param client - The WebSocket client that sent the event
   * @returns An object indicating success and containing the updated timer, or an error message if an error occurred
   * @throws NotFoundException if the timer does not exist
   * @throws BadRequestException if the timer does not belong to the user or is already finished
   */
  @SubscribeMessage('timer:pause')
  async handlePauseTimer(
    @MessageBody() data: { timerId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const timer = await this.timersService.pauseTimer(
        data.timerId,
        data.userId,
      );

      this.server.emit('timer:paused', timer);

      return { success: true, timer };
    } catch (error: unknown) {
      return this.handleError(client, error);
    }
  }

  /**
   * Handles the 'timer:stop' WebSocket event. Stops a timer, calculates its duration, updates the related task's cumulative time, and emits the updated timer to all connected clients.
   * Checks that the timer exists, belongs to the user, and is not already finished.
   * @param data - Object containing timerId, userId, and optional notes to identify which timer to stop and any notes to add
   * @param client - The WebSocket client that sent the event
   * @returns An object indicating success and containing the stopped timer, or an error message if an error occurred
   * @throws NotFoundException if the timer does not exist
   * @throws BadRequestException if the timer does not belong to the user or is already finished
   */
  @SubscribeMessage('timer:stop')
  async handleStopTimer(
    @MessageBody() data: { timerId: string; userId: string; notes?: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const timer = await this.timersService.stopTimer(
        data.timerId,
        data.userId,
        data.notes,
      );

      this.server.emit('timer:stopped', timer);

      return { success: true, timer };
    } catch (error: unknown) {
      return this.handleError(client, error);
    }
  }

  /**
   * Handles the 'timer:getActive' WebSocket event. Retrieves the active timer for a given user and emits it back to the requesting client.
   * An active timer is defined as a timer that has a startTime but no endTime.
   * @param data - Object containing userId to identify which user's active timer to retrieve
   * @param client - The WebSocket client that sent the event
   * @returns An object indicating success and containing the active timer, or an error message if an error occurred
   * @throws NotFoundException if the user does not exist (optional, depending on how you want to handle this case)
   */
  @SubscribeMessage('timer:getActive')
  async handleGetActiveTimer(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const timer = await this.timersService.getActiveTimer(data.userId);

      return { success: true, timer };
    } catch (error: unknown) {
      return this.handleError(client, error);
    }
  }

  /**
   * Handles errors that occur during WebSocket event processing.
   * Extracts a user-friendly error message and emits it back to the client that sent the original event.
   * @param client - The WebSocket client to which the error message should be emitted
   * @param error - The error object that was caught during event processing
   * @returns An object indicating failure and containing the error message
   */
  handleError(client: Socket, error: unknown) {
    let errorMessage = 'Une erreur inattendue est survenue';

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    client.emit('timer:error', { message: errorMessage });
    return { success: false, error: errorMessage };
  }
}
