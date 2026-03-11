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
    "deliveryType" TEXT NOT NULL DEFAULT 'delivery',
    "deliveryCity" TEXT,
    "deliveryPvzCode" TEXT,
    "deliveryPvzAddress" TEXT,
    "deliveryPrice" INTEGER,
    "trackNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "browser_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("confirmationUrl", "createdAt", "deliveryCity", "deliveryPrice", "deliveryPvzAddress", "deliveryPvzCode", "id", "paymentId", "paymentMethod", "status", "telegramUserId", "totalPrice", "trackNumber", "updatedAt", "userId") SELECT "confirmationUrl", "createdAt", "deliveryCity", "deliveryPrice", "deliveryPvzAddress", "deliveryPvzCode", "id", "paymentId", "paymentMethod", "status", "telegramUserId", "totalPrice", "trackNumber", "updatedAt", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
