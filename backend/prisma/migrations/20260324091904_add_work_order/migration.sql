/*
  Warnings:

  - The values [TO_DO,ON_HOLD] on the enum `TaskStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [PO] on the enum `TaskType` will be removed. If these variants are still used in the database, this will fail.
  - The values [LABOR] on the enum `TimeType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `caseId` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `completionNote` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedLaborTime` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `laborTime` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `machineTime` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `oilingTime` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `operatorId` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `note` on the `timers` table. All the data in the column will be lost.
  - You are about to drop the `production_orders` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `project_cases` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `workOrderId` to the `tasks` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'DELIVERED', 'CANCELLED');

-- AlterEnum
BEGIN;
CREATE TYPE "TaskStatus_new" AS ENUM ('TODO', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'VALIDATED');
ALTER TABLE "public"."tasks" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "tasks" ALTER COLUMN "status" TYPE "TaskStatus_new" USING ("status"::text::"TaskStatus_new");
ALTER TYPE "TaskStatus" RENAME TO "TaskStatus_old";
ALTER TYPE "TaskStatus_new" RENAME TO "TaskStatus";
DROP TYPE "public"."TaskStatus_old";
ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'TODO';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TaskType_new" AS ENUM ('CUTTING', 'MACHINING', 'ASSEMBLY', 'FINISHING', 'OILING', 'PACKAGING', 'QUALITY_CHECK');
ALTER TABLE "tasks" ALTER COLUMN "type" TYPE "TaskType_new" USING ("type"::text::"TaskType_new");
ALTER TYPE "TaskType" RENAME TO "TaskType_old";
ALTER TYPE "TaskType_new" RENAME TO "TaskType";
DROP TYPE "public"."TaskType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TimeType_new" AS ENUM ('HUMAN', 'MACHINE', 'OILING');
ALTER TABLE "public"."timers" ALTER COLUMN "timeType" DROP DEFAULT;
ALTER TABLE "timers" ALTER COLUMN "timeType" TYPE "TimeType_new" USING ("timeType"::text::"TimeType_new");
ALTER TYPE "TimeType" RENAME TO "TimeType_old";
ALTER TYPE "TimeType_new" RENAME TO "TimeType";
DROP TYPE "public"."TimeType_old";
ALTER TABLE "timers" ALTER COLUMN "timeType" SET DEFAULT 'HUMAN';
COMMIT;

-- DropForeignKey
ALTER TABLE "production_orders" DROP CONSTRAINT "production_orders_taskId_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_caseId_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_operatorId_fkey";

-- DropIndex
DROP INDEX "tasks_caseId_idx";

-- DropIndex
DROP INDEX "tasks_operatorId_idx";

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "caseId",
DROP COLUMN "completionNote",
DROP COLUMN "estimatedLaborTime",
DROP COLUMN "laborTime",
DROP COLUMN "machineTime",
DROP COLUMN "oilingTime",
DROP COLUMN "operatorId",
ADD COLUMN     "actualHumanTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "actualMachineTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "actualOilingTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "completionNotes" TEXT,
ADD COLUMN     "estimatedHumanTime" DOUBLE PRECISION,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "workOrderId" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'TODO';

-- AlterTable
ALTER TABLE "timers" DROP COLUMN "note",
ADD COLUMN     "notes" TEXT,
ALTER COLUMN "timeType" SET DEFAULT 'HUMAN';

-- DropTable
DROP TABLE "production_orders";

-- DropTable
DROP TABLE "project_cases";

-- DropEnum
DROP TYPE "CaseStatus";

-- CreateTable
CREATE TABLE "work_orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "productType" TEXT,
    "description" TEXT,
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'PENDING',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDelivery" TIMESTAMP(3),
    "actualDelivery" TIMESTAMP(3),
    "specifications" JSONB,
    "billOfMaterials" JSONB NOT NULL,
    "estimatedCost" DOUBLE PRECISION,
    "actualCost" DOUBLE PRECISION,
    "sellingPrice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_orderNumber_key" ON "work_orders"("orderNumber");

-- CreateIndex
CREATE INDEX "work_orders_status_idx" ON "work_orders"("status");

-- CreateIndex
CREATE INDEX "work_orders_orderNumber_idx" ON "work_orders"("orderNumber");

-- CreateIndex
CREATE INDEX "work_orders_customerName_idx" ON "work_orders"("customerName");

-- CreateIndex
CREATE INDEX "tasks_assignedToId_idx" ON "tasks"("assignedToId");

-- CreateIndex
CREATE INDEX "tasks_workOrderId_idx" ON "tasks"("workOrderId");

-- CreateIndex
CREATE INDEX "tasks_dueDate_idx" ON "tasks"("dueDate");

-- CreateIndex
CREATE INDEX "timers_startTime_idx" ON "timers"("startTime");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
