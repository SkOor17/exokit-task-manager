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

  /**
   * Retrieve all tasks with optional filtering based on query parameters.
   * Operators can only see their own tasks, while Admins and Managers can see all tasks.
   * @param query - The query parameters for filtering tasks (status, type, workOrderId, assignedToId, search)
   * @param userId - The ID of the currently authenticated user (optional, used for permission checks)
   * @param userRole - The role of the currently authenticated user (optional, used for permission checks)
   * @returns A list of tasks matching the filtering criteria, including related work order and assigned user information, as well as derived data such as remaining days and total actual time.
   * @throws NotFoundException if no tasks are found matching the criteria (optional, depending on how you want to handle empty results)
   */
  async findAll(query: QueryTaskDto, userId?: string, userRole?: Role) {
    // Construire dynamiquement les conditions de filtrage en fonction des paramètres de requête et du rôle de l'utilisateur
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

  /**
   * Retrieve a single task by its ID. Operators can only access their own tasks, while Admins and Managers can access any task.
   * @param id - The ID of the task to retrieve
   * @returns The task record, including related work order, assigned user, timers, and checklists information
   * @throws NotFoundException if the task does not exist or if an operator tries to access a task that is not assigned to them
   */
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

  /** Create a new task. Only Admins and Managers can perform this action for any user.
   * Operators can only create tasks for themselves.
   * The method checks if the associated work order exists and if the assigned operator (if provided) exists before creating the task.
   * @param createTaskDto - The data transfer object containing the details of the task to be created
   * @param userId - The ID of the currently authenticated user
   * @param userRole - The role of the currently authenticated user
   * @returns The created task record, including related work order and assigned user information
   * @throws NotFoundException if the associated work order does not exist or if the assigned user does not exist
   * @throws ForbiddenException if an operator tries to assign a task to someone else
   */
  async create(createTaskDto: CreateTaskDto, userId: string, userRole: Role) {
    // Vérifier que le dossier (case) existe
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id: createTaskDto.workOrderId },
    });

    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    // Restriction de sécurité pour l'opérateur: ne peut s'assigner que lui-même
    if (userRole === Role.OPERATOR && createTaskDto.assignedToId !== userId) {
      throw new ForbiddenException(
        'Operators can only assign tasks to themselves',
      );
    }

    // Vérifier que l'opérateur assigné existe
    const user = await this.prisma.user.findUnique({
      where: { id: createTaskDto.assignedToId },
    });

    if (!user) {
      throw new NotFoundException('Assigned user not found');
    }

    return this.prisma.task.create({
      data: createTaskDto,
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
      },
    });
  }

  /**
   * Update a task by its ID. Operators can only update their own tasks, while Admins and Managers can update any task.
   * @param id - The ID of the task to update
   * @param updateTaskDto - The data to update the task with
   * @param userId - The ID of the currently authenticated user (optional, used for permission checks)
   * @param userRole - The role of the currently authenticated user (optional, used for permission checks)
   * @returns
   */
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

    // Restriction de sécurité pour l'opérateur: ne peut s'assigner que lui-même
    if (
      userRole === Role.OPERATOR &&
      updateTaskDto.assignedToId &&
      updateTaskDto.assignedToId !== userId
    ) {
      throw new ForbiddenException(
        'Operators can only assign tasks to themselves',
      );
    }

    // Vérifier que l'opérateur assigné existe (si fourni)
    if (updateTaskDto.assignedToId) {
      const user = await this.prisma.user.findUnique({
        where: { id: updateTaskDto.assignedToId },
      });

      if (!user) {
        throw new NotFoundException('Assigned user not found');
      }
    }

    console.log('Updating task with data:', userId, userRole);

    return this.prisma.task.update({
      where: { id },
      data: updateTaskDto,
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
      },
    });
  }

  /**
   * Delete a task by its ID. Only Admins and Managers can perform this action.
   * @param id - The ID of the task to delete
   * @returns The deleted task record
   */
  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.task.delete({
      where: { id },
    });
  }

  /**
   * Retrieve all tasks assigned to the currently authenticated operator.
   */
  async getMyTasks(userId: string) {
    return this.findAll({ assignedToId: userId }, userId, Role.OPERATOR);
  }
}
