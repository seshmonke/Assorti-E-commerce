import { PrismaClient } from './generated/prisma/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

const categories = [
  { name: 'Футболки', section: 'clothing', order: 1 },
  { name: 'Джинсы', section: 'clothing', order: 2 },
  { name: 'Куртки', section: 'clothing', order: 3 },
  { name: 'Шапки', section: 'accessories', order: 4 },
  { name: 'Ремни', section: 'accessories', order: 5 },
  { name: 'Очки', section: 'accessories', order: 6 },
  { name: 'Обувь', section: 'clothing', order: 7 },
  { name: 'Сумки', section: 'accessories', order: 8 },
];

async function seed() {
  try {
    const result = await prisma.category.createMany({ data: categories });
    console.log(`✅ Created ${result.count} categories`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
