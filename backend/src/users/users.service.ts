import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

/**
 * The UsersService class provides methods to manage users in the application.
 * It interacts with the database using PrismaService to perform CRUD operations on user data.
 * The service includes methods to find all users, find a user by ID, create a new user, update an existing user, and soft delete a user by setting the actif field to false.
 */
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find all users in the database. Only active users (actif: true) are returned, and the results are ordered by creation date in descending order.
   * @returns An array of users with the selected fields (id, email, lastName, firstName, role, actif, createdAt)
   */
  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        lastName: true,
        firstName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find a user by ID. If the user does not exist, a NotFoundException is thrown.
   * @param id - The ID of the user to find
   * @returns The user with the selected fields (id, email, lastName, firstName, role, actif, createdAt) and counts of related tasks and timers
   * @throws NotFoundException if the user with the given ID does not exist
   */
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        lastName: true,
        firstName: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            tasks: true,
            timers: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return user;
  }

  /**
   * Create a new user with the provided data. The password is hashed before storing in the database.
   * @param createUserDto - An object containing the user's email, password, lastName, firstName, and role
   * @returns The created user with the selected fields (id, email, lastName, firstName, role)
   */
  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        lastName: true,
        firstName: true,
        role: true,
      },
    });
  }

  /**
   * Update a user by ID. Only the fields provided in updateUserDto will be updated.
   * The method first checks if the user exists, then updates the user with the provided data.
   * @param id - The ID of the user to update
   * @param updateUserDto - An object containing the fields to update (email, lastName, firstName, role, isActive)
   * @returns The updated user with the selected fields (id, email, lastName, firstName, role, isActive)
   * @throws NotFoundException if the user with the given ID does not exist
   */
  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id);

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        lastName: true,
        firstName: true,
        role: true,
        isActive: true,
      },
    });
  }

  /**
   * Delete a user by setting isActive to false (soft delete)
   * @param id - The ID of the user to delete
   * @returns The updated user with isActive set to false
   * @throws NotFoundException if the user with the given ID does not exist
   */
  async remove(id: string) {
    await this.findOne(id);

    // Soft delete: set isActive to false instead of deleting the record
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
