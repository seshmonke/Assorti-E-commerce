const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

const cats = [
  { name: '\u0424\u0443\u0442\u0431\u043e\u043b\u043a\u0438', section: 'clothing', order: 1 },
  { name: '\u0414\u0436\u0438\u043d\u0441\u044b', section: 'clothing', order: 2 },
  { name: '\u041a\u0443\u0440\u0442\u043a\u0438', section: 'clothing', order: 3 },
  { name: '\u0428\u0430\u043f\u043a\u0438', section: 'accessories', order: 4 },
  { name: '\u0420\u0435\u043c\u043d\u0438', section: 'accessories', order: 5 },
  { name: '\u041e\u0447\u043a\u0438', section: 'accessories', order: 6 },
  { name: '\u041e\u0431\u0443\u0432\u044c', section: 'clothing', order: 7 },
  { name: '\u0421\u0443\u043c\u043a\u0438', section: 'accessories', order: 8 },
];

prisma.category.createMany({ data: cats })
  .then((r) => {
    console.log('Created:', r.count);
    return prisma.$disconnect();
  })
  .catch((e) => {
    console.error(e.message);
    return prisma.$disconnect();
  });
