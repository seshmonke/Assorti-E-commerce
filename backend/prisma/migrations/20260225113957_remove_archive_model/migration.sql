/*
  Warnings:

  - You are about to drop the `Archive` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Archive";
PRAGMA foreign_keys=on;
