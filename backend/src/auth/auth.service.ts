import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

/**
 * Service responsible for handling authentication-related operations such as user registration, login, and profile retrieval.
 */
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Register a new user with the provided registration details. This method checks for existing email, hashes the password, and creates a new user in the database.
   * @param registerDto - The registration details including email, password, first name, last name, and optional role.
   * @returns An object containing the newly created user's information and a JWT access token.
   * @throws ConflictException if the email is already in use.
   * @throws InternalServerErrorException for any other errors during registration.
   */
  async register(registerDto: RegisterDto) {
    // Vérifier si l'email existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Créer l'utilisateur
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        lastName: registerDto.lastName,
        firstName: registerDto.firstName,
        role: registerDto.role,
      },
      select: {
        id: true,
        email: true,
        lastName: true,
        firstName: true,
        role: true,
      },
    });

    return {
      user,
      access_token: this.generateToken(user.id),
    };
  }

  /**
   * Authenticate user and return JWT token
   * @param loginDto - The login credentials (email and password)
   * @returns An object containing the user information and access token
   */
  async login(loginDto: LoginDto) {
    // Trouver l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    // Vérifier que le compte est actif
    if (!user.isActive) {
      throw new UnauthorizedException('Ce compte a été désactivé');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        lastName: user.lastName,
        firstName: user.firstName,
        role: user.role,
      },
      access_token: this.generateToken(user.id),
    };
  }

  /**
   * Generate a JWT token for the authenticated user
   * @param userId - The ID of the authenticated user
   * @returns A JWT token string
   */
  private generateToken(userId: string): string {
    const payload = { sub: userId };
    return this.jwtService.sign(payload);
  }

  /**
   * Get the profile of the authenticated user
   * @param userId - The ID of the authenticated user
   * @returns The user's profile information (id, email, lastName, firstName, role, createdAt)
   */
  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        lastName: true,
        firstName: true,
        role: true,
        createdAt: true,
      },
    });
  }
}
