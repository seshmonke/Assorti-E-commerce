/*
  Warnings:

  - You are about to drop the column `reserved` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `reserved` on the `Product` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalPrice" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_payment',
    "paymentMethod" TEXT NOT NULL DEFAULT 'card',
    "paymentId" TEXT,
    "confirmationUrl" TEXT,
    "telegramUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("confirmationUrl", "createdAt", "id", "paymentId", "paymentMethod", "productId", "quantity", "status", "telegramUserId", "totalPrice", "updatedAt") SELECT "confirmationUrl", "createdAt", "id", "paymentId", "paymentMethod", "productId", "quantity", "status", "telegramUserId", "totalPrice", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE TABLE "new_Product" (
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
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("categoryId", "composition", "createdAt", "description", "discount", "id", "image", "name", "price", "sizes", "updatedAt") SELECT "categoryId", "composition", "createdAt", "description", "discount", "id", "image", "name", "price", "sizes", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
