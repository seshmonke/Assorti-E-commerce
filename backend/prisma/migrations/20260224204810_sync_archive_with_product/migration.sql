/*
  Warnings:

  - You are about to drop the column `categoryName` on the `Archive` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Archive" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "image" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sizes" JSONB NOT NULL,
    "composition" JSONB NOT NULL,
    "discount" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Archive_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Archive" ("categoryId", "composition", "createdAt", "description", "discount", "id", "image", "name", "price", "sizes", "updatedAt") SELECT "categoryId", "composition", "createdAt", "description", "discount", "id", "image", "name", "price", "sizes", "updatedAt" FROM "Archive";
DROP TABLE "Archive";
ALTER TABLE "new_Archive" RENAME TO "Archive";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
