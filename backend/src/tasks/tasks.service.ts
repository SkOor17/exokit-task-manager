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
      // Mapping des nouveaux champs de filtrage
      ...(query.status && { status: query.status }),
      ...(query.type && { type: query.type }),
      ...(query.caseId && { caseId: query.caseId }),
      ...(query.operatorId && { operatorId: query.operatorId }),

      // Restriction de sécurité pour l'opérateur
      ...(userRole === Role.OPERATOR && { operatorId: userId }),

      // Logique de recherche (Search)
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          {
            projectCase: {
              orderNumber: { contains: query.search, mode: 'insensitive' },
            },
          },
        ],
      }),
    };

    const tasks = await this.prisma.task.findMany({
      where,
      include: {
        projectCase: {
          select: {
            id: true,
            orderNumber: true,
            customer: true,
          },
        },
        operator: {
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

      const totalTime =
        (task.laborTime || 0) +
        (task.machineTime || 0) +
        (task.oilingTime || 0);

      return {
        ...task,
        remainingDays, // "joursRestants"
        totalTime, // "tempsTotal"
      };
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        projectCase: true,
        operator: {
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
        productionOrder: true,
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
      totalTime: task.laborTime + task.machineTime + task.oilingTime,
    };
  }

  async create(createTaskDto: CreateTaskDto) {
    // Vérifier que le dossier (case) existe
    const projectCase = await this.prisma.projectCase.findUnique({
      where: { id: createTaskDto.caseId },
    });

    if (!projectCase) {
      throw new NotFoundException('Project case not found');
    }

    return this.prisma.task.create({
      data: createTaskDto,
      include: {
        projectCase: true,
        operator: {
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
    if (userRole === Role.OPERATOR && task.operatorId !== userId) {
      throw new ForbiddenException('You can only modify your own tasks');
    }

    return this.prisma.task.update({
      where: { id },
      data: updateTaskDto,
      include: {
        projectCase: true,
        operator: {
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
    return this.findAll({ operatorId: userId }, userId, Role.OPERATOR);
  }
}
