import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCaseDto } from './dto/create-project-case.dto';
import { UpdateCaseDto } from './dto/update-project-case.dto';
import { TaskStatus } from '@prisma/client';

/**
 * Service class responsible for managing project cases in the application.
 * It provides methods to create, retrieve, update, and delete project cases,
 * as well as to format project case data for presentation.
 */
@Injectable()
export class ProjectCasesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Retrieves all project cases from the database, including their associated tasks.
   * Each project case is formatted to include the total number of tasks, the number of completed tasks, and the overall progress percentage.
   * @returns An array of formatted project cases, ordered by creation date in descending order.
   */
  async findAll() {
    const cases = await this.prisma.projectCase.findMany({
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return cases.map(formatProjectCase);
  }

  /**
   * Retrieves a single project case by its unique identifier, including its associated tasks and the operators assigned to those tasks.
   * If the project case does not exist, a NotFoundException is thrown.
   * The returned project case is formatted to include the total number of tasks, the number of completed tasks, and the overall progress percentage.
   * @param id - The unique identifier of the project case to retrieve.
   * @returns The formatted project case with its associated tasks and operator information.
   * @throws NotFoundException if the project case with the specified ID does not exist.
   */
  async findOne(id: string) {
    const projectCase = await this.prisma.projectCase.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            operator: {
              select: {
                id: true,
                lastName: true,
                firstName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!projectCase) {
      throw new NotFoundException('Project case not found');
    }

    return formatProjectCase(projectCase);
  }

  /**
   * Creates a new project case in the database using the provided data transfer object (DTO).
   * Before creating the project case, it checks if a case with the same order number already exists to prevent duplicates. If such a case exists, a ConflictException is thrown.
   * If the creation is successful, the newly created project case is returned.
   * @param createCaseDto - The data transfer object containing the information needed to create a new project case, including order number, customer, description, and status.
   * @returns The newly created project case.
   * @throws ConflictException if a project case with the same order number already exists in the database.
   */
  async create(createCaseDto: CreateCaseDto) {
    const existing = await this.prisma.projectCase.findUnique({
      where: { orderNumber: createCaseDto.orderNumber },
    });

    if (existing) {
      throw new ConflictException('This order number already exists');
    }

    return this.prisma.projectCase.create({
      data: createCaseDto,
    });
  }

  /**
   * Updates an existing project case in the database based on the provided unique identifier and update data transfer object (DTO).
   * @param id - The unique identifier of the project case to update.
   * @param updateCaseDto - The data transfer object containing the updated information for the project case, which may include a new order number, customer, description, and status.
   * @returns The updated project case after applying the changes from the update DTO.
   * @throws NotFoundException if the project case with the specified ID does not exist in the database.
   * @throws ConflictException if the new order number provided in the update DTO already exists for another project case in the database.
   */
  async update(id: string, updateCaseDto: UpdateCaseDto) {
    await this.findOne(id); // Vérifie que le dossier existe bien

    if (updateCaseDto.orderNumber) {
      const existing = await this.prisma.projectCase.findUnique({
        where: { orderNumber: updateCaseDto.orderNumber },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('This order number already exists');
      }
    }

    return this.prisma.projectCase.update({
      where: { id },
      data: updateCaseDto,
    });
  }

  /**
   * Deletes an existing project case from the database based on the provided unique identifier.
   * @param id - The unique identifier of the project case to delete.
   * @returns The deleted project case after it has been removed from the database.
   * @throws NotFoundException if the project case with the specified ID does not exist in the database.
   */
  async remove(id: string) {
    await this.findOne(id); // Vérifie que le dossier existe bien

    return this.prisma.projectCase.delete({
      where: { id },
    });
  }
}

/**
 * Format a project case by calculating total tasks, completed tasks, and progress percentage.
 * @param projectCase - The project case object to format, which must include a "tasks" array with "status" properties.
 * @returns The formatted project case object with additional properties: totalTasks, completedTasks, and progress.
 */
const formatProjectCase = <T extends { tasks: { status: TaskStatus }[] }>(
  projectCase: T,
) => {
  const totalTasks = projectCase.tasks.length;
  const completedTasks = projectCase.tasks.filter(
    (t) =>
      t.status === TaskStatus.COMPLETED || t.status === TaskStatus.VALIDATED,
  ).length;

  return {
    ...projectCase,
    totalTasks,
    completedTasks,
    progress:
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
  };
};
