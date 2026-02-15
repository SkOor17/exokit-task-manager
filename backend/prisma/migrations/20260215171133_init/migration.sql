-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'OPERATEUR');

-- CreateEnum
CREATE TYPE "StatutDossier" AS ENUM ('EN_COURS', 'EN_ATTENTE', 'TERMINEE', 'LIVREE');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('OF', 'ASSEMBLAGE', 'FINITION', 'HUILAGE', 'EMBALLAGE');

-- CreateEnum
CREATE TYPE "StatutTask" AS ENUM ('A_FAIRE', 'EN_COURS', 'EN_PAUSE', 'TERMINEE', 'VALIDEE');

-- CreateEnum
CREATE TYPE "TypeTemps" AS ENUM ('HUMAIN', 'MACHINE', 'HUILAGE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT,
    "role" "Role" NOT NULL DEFAULT 'OPERATEUR',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dossiers_clients" (
    "id" TEXT NOT NULL,
    "numeroCommande" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "description" TEXT,
    "statut" "StatutDossier" NOT NULL DEFAULT 'EN_COURS',
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dossiers_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "type" "TaskType" NOT NULL,
    "priorite" INTEGER NOT NULL DEFAULT 0,
    "statut" "StatutTask" NOT NULL DEFAULT 'A_FAIRE',
    "dateEcheance" TIMESTAMP(3),
    "tempsHumain" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tempsMachine" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tempsHuilage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tempsEstimeHumain" DOUBLE PRECISION,
    "tempsEstimeMachine" DOUBLE PRECISION,
    "tempsEstimeHuilage" DOUBLE PRECISION,
    "descriptionKit" TEXT,
    "noteCompletion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dossierId" TEXT NOT NULL,
    "operateurId" TEXT,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordres_fabrication" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "pieces" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "taskId" TEXT NOT NULL,

    CONSTRAINT "ordres_fabrication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timers" (
    "id" TEXT NOT NULL,
    "debut" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fin" TIMESTAMP(3),
    "duree" INTEGER,
    "enPause" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "typeTemps" "TypeTemps" NOT NULL DEFAULT 'HUMAIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "timers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklists" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "completee" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "taskId" TEXT NOT NULL,

    CONSTRAINT "checklists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "dossiers_clients_numeroCommande_key" ON "dossiers_clients"("numeroCommande");

-- CreateIndex
CREATE INDEX "tasks_statut_idx" ON "tasks"("statut");

-- CreateIndex
CREATE INDEX "tasks_type_idx" ON "tasks"("type");

-- CreateIndex
CREATE INDEX "tasks_operateurId_idx" ON "tasks"("operateurId");

-- CreateIndex
CREATE INDEX "tasks_dossierId_idx" ON "tasks"("dossierId");

-- CreateIndex
CREATE UNIQUE INDEX "ordres_fabrication_numero_key" ON "ordres_fabrication"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "ordres_fabrication_taskId_key" ON "ordres_fabrication"("taskId");

-- CreateIndex
CREATE INDEX "timers_taskId_idx" ON "timers"("taskId");

-- CreateIndex
CREATE INDEX "timers_userId_idx" ON "timers"("userId");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "dossiers_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_operateurId_fkey" FOREIGN KEY ("operateurId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordres_fabrication" ADD CONSTRAINT "ordres_fabrication_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timers" ADD CONSTRAINT "timers_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timers" ADD CONSTRAINT "timers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklists" ADD CONSTRAINT "checklists_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
