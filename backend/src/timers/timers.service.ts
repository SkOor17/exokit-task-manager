import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TimeType, TaskStatus, Prisma } from '@prisma/client';

/**
 * Handle all timer-related operations:
 * - start, pause, stop timers
 * - get active timer for a user
 * - get all timers for a task
 */
@Injectable()
export class TimersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Démarre un timer pour une tâche donnée et un utilisateur donné.
   * Vérifie que la tâche existe et qu'il n'y a pas déjà un timer actif pour cet utilisateur.
   * Si la tâche est en TODO ou PAUSED, la met en IN_PROGRESS.
   * @param taskId - ID de la tâche
   * @param userId - ID de l'utilisateur
   * @param timeType - Type de temps (HUMAN, MACHINE, OILING)
   * @returns Le timer créé avec les informations de la tâche et de l'utilisateur
   * @throws NotFoundException si la tâche n'existe pas
   * @throws BadRequestException si l'utilisateur a déjà un timer actif
   */
  async startTimer(
    taskId: string,
    userId: string,
    timeType: TimeType = TimeType.HUMAN,
  ) {
    // Vérifier que la tâche existe
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Vérifier qu'il n'y a pas déjà un timer actif pour cet utilisateur
    const activeTimer = await this.prisma.timer.findFirst({
      where: {
        userId,
        endTime: null,
      },
    });

    if (activeTimer) {
      throw new BadRequestException('You already have an active timer');
    }

    // Créer le timer
    const timer = await this.prisma.timer.create({
      data: {
        taskId,
        userId,
        timeType,
        startTime: new Date(),
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            id: true,
            lastName: true,
            firstName: true,
          },
        },
      },
    });

    // Mettre à jour le statut de la tâche si elle n'est pas déjà en cours
    if (task.status === TaskStatus.TODO || task.status === TaskStatus.PAUSED) {
      await this.prisma.task.update({
        where: { id: taskId },
        data: { status: TaskStatus.IN_PROGRESS },
      });
    }

    return timer;
  }

  /**
   * Pauses or resumes a timer. If the timer is currently running, it will be paused. If it's paused, it will be resumed.
   * Checks that the timer exists, belongs to the user, and is not already finished.
   * @param timerId - ID of the timer to pause/resume
   * @param userId - ID of the user who owns the timer
   * @returns The updated timer with the new paused state
   * @throws NotFoundException if the timer does not exist
   * @throws BadRequestException if the timer does not belong to the user or is already finished
   */
  async pauseTimer(timerId: string, userId: string) {
    const timer = await this.prisma.timer.findUnique({
      where: { id: timerId },
    });

    if (!timer) {
      throw new NotFoundException('Timer not found');
    }

    if (timer.userId !== userId) {
      throw new BadRequestException('This timer does not belong to you');
    }

    if (timer.endTime) {
      throw new BadRequestException('This timer is already finished');
    }

    const updatedTimer = await this.prisma.timer.update({
      where: { id: timerId },
      data: { isPaused: !timer.isPaused },
    });

    // Si on met en pause, on peut optionnellement mettre la tâche en PAUSED
    // Mais attention si d'autres timers tournent sur la même tâche
    // Pour l'instant, on se contente de basculer l'état du timer

    return updatedTimer;
  }

  /**
   * Stops a timer. Checks that the timer exists, belongs to the user, and is not already finished.
   * @param timerId - ID of the timer to stop
   * @param userId - ID of the user who owns the timer
   * @param notes - Optional notes to add when stopping the timer
   * @returns The updated timer with endTime, duration, and notes
   * @throws NotFoundException if the timer does not exist
   * @throws BadRequestException if the timer does not belong to the user or is already finished
   */
  async stopTimer(timerId: string, userId: string, notes?: string) {
    // TODO: Empêcher l'arrêt d'un timer si la tâche est déjà marquée comme COMPLETED ou VALIDATED

    const timer = await this.prisma.timer.findUnique({
      where: { id: timerId },
      include: {
        task: true,
      },
    });

    if (!timer) {
      throw new NotFoundException('Timer not found');
    }

    if (timer.userId !== userId) {
      throw new BadRequestException('This timer does not belong to you');
    }

    if (timer.endTime) {
      throw new BadRequestException('This timer is already finished');
    }

    const endTime = new Date();
    const durationInSeconds = Math.floor(
      (endTime.getTime() - timer.startTime.getTime()) / 1000,
    );
    const durationInHours = durationInSeconds / 3600;

    // Mettre à jour le timer
    const updatedTimer = await this.prisma.timer.update({
      where: { id: timerId },
      data: {
        endTime,
        duration: durationInSeconds,
        notes,
      },
    });

    // Mettre à jour le temps cumulé dans la tâche
    const updateData: Prisma.TaskUpdateInput = {};
    if (timer.timeType === TimeType.HUMAN) {
      updateData.actualHumanTime = { increment: durationInHours };
    } else if (timer.timeType === TimeType.MACHINE) {
      updateData.actualMachineTime = { increment: durationInHours };
    } else if (timer.timeType === TimeType.OILING) {
      updateData.actualOilingTime = { increment: durationInHours };
    }

    await this.prisma.task.update({
      where: { id: timer.taskId },
      data: updateData,
    });

    return updatedTimer;
  }

  /**
   * Retrives the active timer for a given user. An active timer is defined as a timer that has a startTime but no endTime.
   * @param userId - ID of the user to retrieve the active timer for
   * @returns The active timer for the user, or null if there is no active timer. The returned timer includes related task and user information.
   * @throws NotFoundException if the user does not exist (optional, depending on how you want to handle this case)
   */
  async getActiveTimer(userId: string) {
    return this.prisma.timer.findFirst({
      where: {
        userId,
        endTime: null,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            workOrder: {
              select: {
                orderNumber: true,
                customerName: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Retrieves all timers for a given task, ordered by start time in descending order.
   * Each timer includes related user information (id, lastName, firstName).
   * @param taskId - ID of the task for which to retrieve timers
   * @returns A list of timers for the specified task
   * @throws NotFoundException if the task does not exist (optional, depending on how you want to handle this case)
   */
  async getTaskTimers(taskId: string) {
    return this.prisma.timer.findMany({
      where: { taskId },
      include: {
        user: {
          select: {
            id: true,
            lastName: true,
            firstName: true,
          },
        },
      },
      orderBy: { startTime: 'desc' },
    });
  }
}
