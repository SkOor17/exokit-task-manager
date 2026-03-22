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
      // Ajout conditionnel des propriétés seulement si elles existent
      ...(query.statut && { statut: query.statut }),
      ...(query.type && { type: query.type }),
      ...(query.dossierId && { dossierId: query.dossierId }),
      ...(query.operateurId && { operateurId: query.operateurId }),

      // Restriction de sécurité pour l'opérateur
      ...(userRole === Role.OPERATEUR && { operateurId: userId }),

      // Logique de recherche (Search)
      ...(query.search && {
        OR: [
          { titre: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          {
            dossier: {
              numeroCommande: { contains: query.search, mode: 'insensitive' },
            },
          },
        ],
      }),
    };

    const tasks = await this.prisma.task.findMany({
      where,
      include: {
        dossier: {
          select: {
            id: true,
            numeroCommande: true,
            client: true,
          },
        },
        operateur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
        _count: {
          select: {
            timers: true,
          },
        },
      },
      orderBy: [{ priorite: 'desc' }, { dateEcheance: 'asc' }],
    });

    const today = new Date().getTime();
    const ONE_DAY_MS = 1000 * 60 * 60 * 24;

    // Calculer les jours restants
    return tasks.map((task) => {
      const joursRestants = task.dateEcheance
        ? Math.ceil(
            (new Date(task.dateEcheance).getTime() - today) / ONE_DAY_MS,
          )
        : null;

      const tempsTotal =
        (task.tempsHumain || 0) +
        (task.tempsMachine || 0) +
        (task.tempsHuilage || 0);

      return {
        ...task,
        joursRestants,
        tempsTotal,
      };
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        dossier: true,
        operateur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        timers: {
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
              },
            },
          },
          orderBy: { debut: 'desc' },
        },
        checklists: true,
        ordreFabrication: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }

    return {
      ...task,
      joursRestants: task.dateEcheance
        ? Math.ceil(
            (new Date(task.dateEcheance).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : null,
      tempsTotal: task.tempsHumain + task.tempsMachine + task.tempsHuilage,
    };
  }

  async create(createTaskDto: CreateTaskDto) {
    // Vérifier que le dossier existe
    const dossier = await this.prisma.dossierClient.findUnique({
      where: { id: createTaskDto.dossierId },
    });

    if (!dossier) {
      throw new NotFoundException('Dossier client non trouvé');
    }

    return this.prisma.task.create({
      data: createTaskDto,
      include: {
        dossier: true,
        operateur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
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
    if (userRole === Role.OPERATEUR && task.operateurId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que vos propres tâches',
      );
    }

    return this.prisma.task.update({
      where: { id },
      data: updateTaskDto,
      include: {
        dossier: true,
        operateur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
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
    return this.findAll({ operateurId: userId }, userId, Role.OPERATEUR);
  }
}
