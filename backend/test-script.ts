import { prisma } from './src/lib/prisma.js';

/**
 * Тестовый скрипт для добавления товаров в базу данных
 */

async function addTestProducts() {
    try {
        console.log('🚀 Начинаю добавление тестовых товаров...\n');

        // Сначала получим или создадим категории
        let tshirtsCat = await prisma.category.findFirst({
            where: { name: 'Футболки' }
        });
        if (!tshirtsCat) {
            tshirtsCat = await prisma.category.create({
                data: { name: 'Футболки', section: 'clothing', order: 1 }
            });
        }

        let jeansCat = await prisma.category.findFirst({
            where: { name: 'Джинсы' }
        });
        if (!jeansCat) {
            jeansCat = await prisma.category.create({
                data: { name: 'Джинсы', section: 'clothing', order: 2 }
            });
        }

        let jacketsCat = await prisma.category.findFirst({
            where: { name: 'Куртки' }
        });
        if (!jacketsCat) {
            jacketsCat = await prisma.category.create({
                data: { name: 'Куртки', section: 'clothing', order: 3 }
            });
        }

        let shoesCat = await prisma.category.findFirst({
            where: { name: 'Обувь' }
        });
        if (!shoesCat) {
            shoesCat = await prisma.category.create({
                data: { name: 'Обувь', section: 'clothing', order: 8 }
            });
        }

        // Пример 1: Добавление футболки
        const tshirt = await prisma.product.create({
            data: {
                name: 'Классическая чёрная футболка',
                price: 1500,
                image: 'https://example.com/tshirt-black.jpg',
                categoryId: tshirtsCat.id,
                description: 'Удобная хлопковая футболка чёрного цвета',
                sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
                composition: JSON.stringify({
                    cotton: 100,
                }),
            },
            include: { category: true },
        });
        console.log('✅ Футболка добавлена:', tshirt);

        // Пример 2: Добавление джинсов
        const jeans = await prisma.product.create({
            data: {
                name: 'Синие классические джинсы',
                price: 3500,
                image: 'https://example.com/jeans-blue.jpg',
                categoryId: jeansCat.id,
                description: 'Классические синие джинсы с прямым кроем',
                sizes: JSON.stringify(['28', '30', '32', '34', '36', '38']),
                composition: JSON.stringify({
                    cotton: 98,
                    elastane: 2,
                }),
            },
            include: { category: true },
        });
        console.log('✅ Джинсы добавлены:', jeans);

        // Пример 3: Добавление куртки со скидкой
        const jacket = await prisma.product.create({
            data: {
                name: 'Кожаная куртка',
                price: 8000,
                image: 'https://example.com/jacket-leather.jpg',
                categoryId: jacketsCat.id,
                description: 'Стильная кожаная куртка чёрного цвета',
                sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
                composition: JSON.stringify({
                    leather: 100,
                }),
                discount: 20,
            },
            include: { category: true },
        });
        console.log('✅ Куртка добавлена:', jacket);

        // Пример 5: Добавление обуви
        const shoes = await prisma.product.create({
            data: {
                name: 'Кроссовки спортивные',
                price: 5000,
                image: 'https://example.com/shoes-sneakers.jpg',
                categoryId: shoesCat.id,
                description: 'Удобные спортивные кроссовки',
                sizes: JSON.stringify(['36', '37', '38', '39', '40', '41', '42', '43', '44', '45']),
                composition: JSON.stringify({
                    textile: 60,
                    rubber: 40,
                }),
            },
            include: { category: true },
        });
        console.log('✅ Обувь добавлена:', shoes);

        // Пример 6: Добавление товара со скидкой (попадёт в SALE автоматически)
        const saleItem = await prisma.product.create({
            data: {
                name: 'Льняная рубашка',
                price: 1200,
                image: 'https://example.com/shirt-sale.jpg',
                categoryId: tshirtsCat.id,
                description: 'Льняная рубашка со скидкой',
                sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
                composition: JSON.stringify({
                    linen: 100,
                }),
                discount: 50,
            },
            include: { category: true },
        });
        console.log('✅ Товар со скидкой добавлен:', saleItem);

        console.log('\n✨ Все тестовые товары успешно добавлены!');

        // Вывод всех товаров
        const allProducts = await prisma.product.findMany({
            include: { category: true },
        });
        console.log(`\n📊 Всего товаров в БД: ${allProducts.length}`);
        console.log('Товары:', allProducts);
    } catch (error) {
        console.error('❌ Ошибка при добавлении товаров:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Запуск скрипта
addTestProducts();
