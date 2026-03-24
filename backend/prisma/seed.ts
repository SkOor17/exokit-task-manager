import * as bcrypt from 'bcrypt';
import {
  PrismaClient,
  Role,
  TaskStatus,
  TaskType,
  WorkOrderStatus,
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

  // 4. Create a Work Order (Anciennement Project Case)
  const workOrder = await prisma.workOrder.create({
    data: {
      orderNumber: 'OF-2026-001', // Remplacé "CMD" par "OF" (Ordre de Fabrication) pour la cohérence
      customerName: 'Restaurant Le Gourmet', // Ancien: customer
      description: 'Custom tables and chairs',
      status: WorkOrderStatus.IN_PROGRESS, // Ancien: CaseStatus
      // Ajout du champ requis par ton nouveau schéma
      billOfMaterials: [
        { item: 'Chêne massif', quantity: 5, unit: 'm3' },
        { item: 'Pieds métalliques', quantity: 20, unit: 'pcs' },
      ],
    },
  });

  console.log('✅ Work Order created');

  // 5. Create Tasks
  await prisma.task.create({
    data: {
      title: 'Plank cutting',
      description: 'Cut oak planks according to blueprints',
      type: TaskType.CUTTING, // Ancien: TaskType.PO
      priority: 2,
      status: TaskStatus.TODO, // Ancien: TaskStatus.TO_DO
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
      estimatedHumanTime: 4.0, // Ancien: estimatedLaborTime
      workOrderId: workOrder.id, // Ancien: caseId
      assignedToId: operator1.id, // Ancien: operatorId
    },
  });

  await prisma.task.create({
    data: {
      title: 'Table assembly',
      description: 'Assemble legs and tabletop',
      type: TaskType.ASSEMBLY,
      priority: 1,
      status: TaskStatus.TODO, // Ancien: TaskStatus.TO_DO
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // +10 days
      estimatedHumanTime: 6.0, // Ancien: estimatedLaborTime
      workOrderId: workOrder.id, // Ancien: caseId
      assignedToId: operator1.id, // Ancien: operatorId
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
