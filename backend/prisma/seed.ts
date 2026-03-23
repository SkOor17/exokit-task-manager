import * as bcrypt from 'bcrypt';
import {
  CaseStatus,
  PrismaClient,
  Role,
  TaskStatus,
  TaskType,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seeding...');

  // 1. Create an Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@menuiserie.com' },
    update: {},
    create: {
      email: 'admin@menuiserie.com',
      password: adminPassword,
      lastName: 'Admin',
      firstName: 'System',
      role: Role.ADMIN,
    },
  });

  // 2. Create a Manager
  const managerPassword = await bcrypt.hash('manager123', 10);
  await prisma.user.upsert({
    where: { email: 'manager@menuiserie.com' },
    update: {},
    create: {
      email: 'manager@menuiserie.com',
      password: managerPassword,
      lastName: 'Dupont',
      firstName: 'Marie',
      role: Role.MANAGER,
    },
  });

  // 3. Create Operators
  const operator1Password = await bcrypt.hash('operator123', 10);
  const operator1 = await prisma.user.upsert({
    where: { email: 'jean@menuiserie.com' },
    update: {},
    create: {
      email: 'jean@menuiserie.com',
      password: operator1Password,
      lastName: 'Martin',
      firstName: 'Jean',
      role: Role.OPERATOR,
    },
  });

  console.log('✅ Users created');

  // 4. Create a Project Case (Dossier Client)
  const projectCase = await prisma.projectCase.create({
    data: {
      orderNumber: 'CMD-2026-001',
      customer: 'Restaurant Le Gourmet',
      description: 'Custom tables and chairs',
      status: CaseStatus.IN_PROGRESS,
    },
  });

  console.log('✅ Project case created');

  // 5. Create Tasks
  await prisma.task.create({
    data: {
      title: 'Plank cutting',
      description: 'Cut oak planks according to blueprints',
      type: TaskType.PO,
      priority: 2,
      status: TaskStatus.TO_DO,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
      estimatedLaborTime: 4.0,
      caseId: projectCase.id,
      operatorId: operator1.id,
    },
  });

  await prisma.task.create({
    data: {
      title: 'Table assembly',
      description: 'Assemble legs and tabletop',
      type: TaskType.ASSEMBLY,
      priority: 1,
      status: TaskStatus.TO_DO,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // +10 days
      estimatedLaborTime: 6.0,
      caseId: projectCase.id,
      operatorId: operator1.id,
    },
  });

  console.log('✅ Tasks created');
  console.log('🎉 Seeding finished!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
