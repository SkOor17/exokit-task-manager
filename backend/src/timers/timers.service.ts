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

    // Créer le timer (duration initialisé à 0)
    const timer = await this.prisma.timer.create({
      data: {
        taskId,
        userId,
        timeType,
        startTime: new Date(),
        duration: 0,
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
   * Pauses or resumes a timer.
   * When pausing: calculate the time elapsed since startTime and add it to duration.
   * When resuming: update startTime to the current time so the next segment starts correctly.
   * @param timerId - ID of the timer to pause/resume
   * @param userId - ID of the user who owns the timer
   * @returns The updated timer with the new paused state and accumulated duration
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

    const now = new Date();
    const isPausing = !timer.isPaused;
    let newDuration = timer.duration || 0;

    if (isPausing) {
      // On passe en pause : on ajoute le temps écoulé depuis le dernier startTime
      const segmentSeconds = Math.floor(
        (now.getTime() - timer.startTime.getTime()) / 1000,
      );
      newDuration += segmentSeconds;
    }

    const updatedTimer = await this.prisma.timer.update({
      where: { id: timerId },
      data: {
        isPaused: isPausing,
        duration: newDuration,
        startTime: now, // Toujours mettre à jour startTime pour le prochain segment
      },
    });

    // Optionnel : Mettre à jour le statut de la tâche
    if (isPausing) {
      await this.prisma.task.update({
        where: { id: timer.taskId },
        data: { status: TaskStatus.PAUSED },
      });
    } else {
      await this.prisma.task.update({
        where: { id: timer.taskId },
        data: { status: TaskStatus.IN_PROGRESS },
      });
    }

    return updatedTimer;
  }

  /**
   * Stops a timer.
   * Calculates the final duration by adding the last segment to the accumulated duration.
   * @param timerId - ID of the timer to stop
   * @param userId - ID of the user who owns the timer
   * @param notes - Optional notes to add when stopping the timer
   * @returns The updated timer with endTime, duration, and notes
   * @throws NotFoundException if the timer does not exist
   * @throws BadRequestException if the timer does not belong to the user or is already finished
   */
  async stopTimer(timerId: string, userId: string, notes?: string) {
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

    const now = new Date();
    let finalDuration = timer.duration || 0;

    // Si le timer n'était pas en pause, on ajoute le dernier segment
    if (!timer.isPaused) {
      const segmentSeconds = Math.floor(
        (now.getTime() - timer.startTime.getTime()) / 1000,
      );
      finalDuration += segmentSeconds;
    }

    // Mettre à jour le timer
    const updatedTimer = await this.prisma.timer.update({
      where: { id: timerId },
      data: {
        endTime: now,
        duration: finalDuration,
        isPaused: false, // Forcer à false une fois terminé
        notes,
      },
    });

    // Mettre à jour le temps cumulé dans la tâche (en heures)
    const durationInHours = finalDuration / 3600;
    const updateData: Prisma.TaskUpdateInput = {};
    if (timer.timeType === TimeType.HUMAN) {
      updateData.actualHumanTime = { increment: durationInHours };
    } else if (timer.timeType === TimeType.MACHINE) {
      updateData.actualMachineTime = { increment: durationInHours };
    } else if (timer.timeType === TimeType.OILING) {
      updateData.actualOilingTime = { increment: durationInHours };
    }

    // Passer la tâche en COMPLETED si c'était le dernier timer actif ?
    // Pour l'instant on garde le statut actuel ou on peut forcer COMPLETED selon le besoin
    // Mais ici on se contente d'ajouter le temps.
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
