/*
  Warnings:

  - You are about to drop the column `image` on the `Product` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "images" JSONB NOT NULL DEFAULT [],
    "categoryId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sizes" JSONB NOT NULL,
    "composition" JSONB NOT NULL,
    "discount" INTEGER,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("archive", "categoryId", "composition", "createdAt", "description", "discount", "id", "name", "price", "sizes", "updatedAt") SELECT "archive", "categoryId", "composition", "createdAt", "description", "discount", "id", "name", "price", "sizes", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
