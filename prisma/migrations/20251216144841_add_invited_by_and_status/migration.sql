/*
  Warnings:

  - You are about to drop the column `accepted` on the `Invitation` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `Invitation` table. All the data in the column will be lost.
  - You are about to drop the column `token` on the `Invitation` table. All the data in the column will be lost.
  - Added the required column `invitedBy` to the `Invitation` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Invitation_tenantId_email_key";

-- DropIndex
DROP INDEX "Invitation_token_key";

-- AlterTable
ALTER TABLE "Invitation" DROP COLUMN "accepted",
DROP COLUMN "expiresAt",
DROP COLUMN "token",
ADD COLUMN     "invitedBy" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';
