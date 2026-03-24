import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { Prisma, Role } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryTaskDto, userId?: string, userRole?: Role) {
    const where: Prisma.TaskWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.type && { type: query.type }),
      ...(query.workOrderId && { workOrderId: query.workOrderId }),
      ...(query.assignedToId && { assignedToId: query.assignedToId }),

      // Restriction de sécurité pour l'opérateur
      ...(userRole === Role.OPERATOR && { assignedToId: userId }),

      // Logique de recherche
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          {
            workOrder: {
              orderNumber: { contains: query.search, mode: 'insensitive' },
            },
          },
          {
            workOrder: {
              customerName: { contains: query.search, mode: 'insensitive' },
            },
          },
        ],
      }),
    };

    const tasks = await this.prisma.task.findMany({
      where,
      include: {
        workOrder: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            lastName: true,
            firstName: true,
          },
        },
        _count: {
          select: {
            timers: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    });

    const today = new Date().getTime();
    const ONE_DAY_MS = 1000 * 60 * 60 * 24;

    // Calculer les données dérivées (jours restants et temps total)
    return tasks.map((task) => {
      const remainingDays = task.dueDate
        ? Math.ceil((new Date(task.dueDate).getTime() - today) / ONE_DAY_MS)
        : null;

      const totalActualTime =
        (task.actualHumanTime || 0) +
        (task.actualMachineTime || 0) +
        (task.actualOilingTime || 0);

      return {
        ...task,
        remainingDays,
        totalActualTime,
      };
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        workOrder: true,
        assignedTo: {
          select: {
            id: true,
            lastName: true,
            firstName: true,
            email: true,
          },
        },
        timers: {
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
        },
        checklists: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const ONE_DAY_MS = 1000 * 60 * 60 * 24;

    return {
      ...task,
      remainingDays: task.dueDate
        ? Math.ceil(
            (new Date(task.dueDate).getTime() - new Date().getTime()) /
              ONE_DAY_MS,
          )
        : null,
      totalTime:
        task.actualHumanTime + task.actualMachineTime + task.actualOilingTime,
    };
  }

  async create(createTaskDto: CreateTaskDto) {
    // Vérifier que le dossier (case) existe
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id: createTaskDto.workOrderId },
    });

    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    return this.prisma.task.create({
      data: createTaskDto,
      include: {
        workOrder: true,
        assignedTo: {
          select: {
            id: true,
            lastName: true,
            firstName: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    userId?: string,
    userRole?: Role,
  ) {
    const task = await this.findOne(id);

    // Vérifier les permissions
    if (userRole === Role.OPERATOR && task.assignedToId !== userId) {
      throw new ForbiddenException('You can only modify your own tasks');
    }

    return this.prisma.task.update({
      where: { id },
      data: updateTaskDto,
      include: {
        workOrder: true,
        assignedTo: {
          select: {
            id: true,
            lastName: true,
            firstName: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.task.delete({
      where: { id },
    });
  }

  async getMyTasks(userId: string) {
    return this.findAll({ assignedToId: userId }, userId, Role.OPERATOR);
  }
}
