-- CreateTable
CREATE TABLE "browser_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "telegramId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "telegram" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "totalPrice" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_payment',
    "paymentMethod" TEXT NOT NULL DEFAULT 'card',
    "paymentId" TEXT,
    "confirmationUrl" TEXT,
    "telegramUserId" TEXT,
    "userId" TEXT,
    "deliveryCity" TEXT,
    "deliveryPvzCode" TEXT,
    "deliveryPvzAddress" TEXT,
    "deliveryPrice" INTEGER,
    "trackNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "browser_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("confirmationUrl", "createdAt", "id", "paymentId", "paymentMethod", "status", "telegramUserId", "totalPrice", "updatedAt") SELECT "confirmationUrl", "createdAt", "id", "paymentId", "paymentMethod", "status", "telegramUserId", "totalPrice", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
