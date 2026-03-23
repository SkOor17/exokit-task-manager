/*
  Warnings:

  - The values [OPERATEUR] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - The values [OF,ASSEMBLAGE,FINITION,HUILAGE,EMBALLAGE] on the enum `TaskType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `completee` on the `checklists` table. All the data in the column will be lost.
  - You are about to drop the column `titre` on the `checklists` table. All the data in the column will be lost.
  - You are about to drop the column `dateEcheance` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `descriptionKit` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `dossierId` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `noteCompletion` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `operateurId` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `priorite` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `statut` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `tempsEstimeHuilage` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `tempsEstimeHumain` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `tempsEstimeMachine` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `tempsHuilage` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `tempsHumain` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `tempsMachine` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `titre` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `debut` on the `timers` table. All the data in the column will be lost.
  - You are about to drop the column `duree` on the `timers` table. All the data in the column will be lost.
  - You are about to drop the column `enPause` on the `timers` table. All the data in the column will be lost.
  - You are about to drop the column `fin` on the `timers` table. All the data in the column will be lost.
  - You are about to drop the column `typeTemps` on the `timers` table. All the data in the column will be lost.
  - You are about to drop the column `actif` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `nom` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `prenom` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `dossiers_clients` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ordres_fabrication` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `title` to the `checklists` table without a default value. This is not possible if the table is not empty.
  - Added the required column `caseId` to the `tasks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `tasks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('IN_PROGRESS', 'PENDING', 'COMPLETED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TO_DO', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'VALIDATED');

-- CreateEnum
CREATE TYPE "TimeType" AS ENUM ('LABOR', 'MACHINE', 'OILING');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'MANAGER', 'OPERATOR');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'OPERATOR';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TaskType_new" AS ENUM ('PO', 'ASSEMBLY', 'FINISHING', 'OILING', 'PACKAGING');
ALTER TABLE "tasks" ALTER COLUMN "type" TYPE "TaskType_new" USING ("type"::text::"TaskType_new");
ALTER TYPE "TaskType" RENAME TO "TaskType_old";
ALTER TYPE "TaskType_new" RENAME TO "TaskType";
DROP TYPE "public"."TaskType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "ordres_fabrication" DROP CONSTRAINT "ordres_fabrication_taskId_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_dossierId_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_operateurId_fkey";

-- DropIndex
DROP INDEX "tasks_dossierId_idx";

-- DropIndex
DROP INDEX "tasks_operateurId_idx";

-- DropIndex
DROP INDEX "tasks_statut_idx";

-- AlterTable
ALTER TABLE "checklists" DROP COLUMN "completee",
DROP COLUMN "titre",
ADD COLUMN     "isCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "dateEcheance",
DROP COLUMN "descriptionKit",
DROP COLUMN "dossierId",
DROP COLUMN "noteCompletion",
DROP COLUMN "operateurId",
DROP COLUMN "priorite",
DROP COLUMN "statut",
DROP COLUMN "tempsEstimeHuilage",
DROP COLUMN "tempsEstimeHumain",
DROP COLUMN "tempsEstimeMachine",
DROP COLUMN "tempsHuilage",
DROP COLUMN "tempsHumain",
DROP COLUMN "tempsMachine",
DROP COLUMN "titre",
ADD COLUMN     "caseId" TEXT NOT NULL,
ADD COLUMN     "completionNote" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "estimatedLaborTime" DOUBLE PRECISION,
ADD COLUMN     "estimatedMachineTime" DOUBLE PRECISION,
ADD COLUMN     "estimatedOilingTime" DOUBLE PRECISION,
ADD COLUMN     "kitDescription" TEXT,
ADD COLUMN     "laborTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "machineTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "oilingTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "operatorId" TEXT,
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "TaskStatus" NOT NULL DEFAULT 'TO_DO',
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "timers" DROP COLUMN "debut",
DROP COLUMN "duree",
DROP COLUMN "enPause",
DROP COLUMN "fin",
DROP COLUMN "typeTemps",
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "isPaused" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "timeType" "TimeType" NOT NULL DEFAULT 'LABOR';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "actif",
DROP COLUMN "nom",
DROP COLUMN "prenom",
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastName" TEXT NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'OPERATOR';

-- DropTable
DROP TABLE "dossiers_clients";

-- DropTable
DROP TABLE "ordres_fabrication";

-- DropEnum
DROP TYPE "StatutDossier";

-- DropEnum
DROP TYPE "StatutTask";

-- DropEnum
DROP TYPE "TypeTemps";

-- CreateTable
CREATE TABLE "project_cases" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "description" TEXT,
    "status" "CaseStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_orders" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "parts" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "taskId" TEXT NOT NULL,

    CONSTRAINT "production_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_cases_orderNumber_key" ON "project_cases"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "production_orders_number_key" ON "production_orders"("number");

-- CreateIndex
CREATE UNIQUE INDEX "production_orders_taskId_key" ON "production_orders"("taskId");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_operatorId_idx" ON "tasks"("operatorId");

-- CreateIndex
CREATE INDEX "tasks_caseId_idx" ON "tasks"("caseId");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "project_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
