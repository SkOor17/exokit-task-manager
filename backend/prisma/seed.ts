import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Démarrage du seeding...');

  // Créer un admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@menuiserie.com' },
    update: {},
    create: {
      email: 'admin@menuiserie.com',
      password: adminPassword,
      nom: 'Admin',
      prenom: 'Système',
      role: 'ADMIN',
    },
  });

  // Créer un manager
  const managerPassword = await bcrypt.hash('manager123', 10);
  await prisma.user.upsert({
    where: { email: 'manager@menuiserie.com' },
    update: {},
    create: {
      email: 'manager@menuiserie.com',
      password: managerPassword,
      nom: 'Dupont',
      prenom: 'Marie',
      role: 'MANAGER',
    },
  });

  // Créer des opérateurs
  const operateur1Password = await bcrypt.hash('operateur123', 10);
  const operateur1 = await prisma.user.upsert({
    where: { email: 'jean@menuiserie.com' },
    update: {},
    create: {
      email: 'jean@menuiserie.com',
      password: operateur1Password,
      nom: 'Martin',
      prenom: 'Jean',
      role: 'OPERATEUR',
    },
  });

  console.log('✅ Utilisateurs créés');

  // Créer un dossier client
  const dossier = await prisma.dossierClient.create({
    data: {
      numeroCommande: 'CMD-2026-001',
      client: 'Restaurant Le Gourmet',
      description: 'Tables et chaises sur mesure',
      statut: 'EN_COURS',
    },
  });

  console.log('✅ Dossier client créé');

  // Créer des tâches
  await prisma.task.create({
    data: {
      titre: 'Découpe des planches',
      description: 'Découper les planches de chêne selon les plans',
      type: 'OF',
      priorite: 2,
      statut: 'A_FAIRE',
      dateEcheance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 jours
      tempsEstimeHumain: 4.0,
      dossierId: dossier.id,
      operateurId: operateur1.id,
    },
  });

  await prisma.task.create({
    data: {
      titre: 'Assemblage des tables',
      description: 'Assembler les pieds et le plateau',
      type: 'ASSEMBLAGE',
      priorite: 1,
      statut: 'A_FAIRE',
      dateEcheance: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // +10 jours
      tempsEstimeHumain: 6.0,
      dossierId: dossier.id,
      operateurId: operateur1.id,
    },
  });

  console.log('✅ Tâches créées');

  console.log('🎉 Seeding terminé !');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
