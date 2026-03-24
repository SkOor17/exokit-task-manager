import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ProjectCasesService } from './project-cases.service';
import { CreateCaseDto } from './dto/create-project-case.dto';
import { UpdateCaseDto } from './dto/update-project-case.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectCasesController {
  constructor(private readonly projectCasesService: ProjectCasesService) {}

  @Get()
  findAll() {
    return this.projectCasesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectCasesService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  create(@Body() createCaseDto: CreateCaseDto) {
    return this.projectCasesService.create(createCaseDto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  update(@Param('id') id: string, @Body() updateCaseDto: UpdateCaseDto) {
    return this.projectCasesService.update(id, updateCaseDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.projectCasesService.remove(id);
  }
}
