import { prisma } from './lib/prisma.js';

/**
 * Тестовый скрипт для добавления товаров в базу данных
 */

async function addTestProducts() {
    try {
        console.log('🚀 Начинаю добавление тестовых товаров...\n');

        // Пример 1: Добавление футболки
        const tshirt = await prisma.product.create({
            data: {
                name: 'Классическая чёрная футболка',
                price: 1500,
                image: 'https://example.com/tshirt-black.jpg',
                category: 'tshirts',
                description: 'Удобная хлопковая футболка чёрного цвета',
                sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
                composition: JSON.stringify({
                    cotton: 100,
                }),
            },
        });
        console.log('✅ Футболка добавлена:', tshirt);

        // Пример 2: Добавление джинсов
        const jeans = await prisma.product.create({
            data: {
                name: 'Синие классические джинсы',
                price: 3500,
                image: 'https://example.com/jeans-blue.jpg',
                category: 'jeans',
                description: 'Классические синие джинсы с прямым кроем',
                sizes: JSON.stringify(['28', '30', '32', '34', '36', '38']),
                composition: JSON.stringify({
                    cotton: 98,
                    elastane: 2,
                }),
            },
        });
        console.log('✅ Джинсы добавлены:', jeans);

        // Пример 3: Добавление куртки со скидкой
        const jacket = await prisma.product.create({
            data: {
                name: 'Кожаная куртка',
                price: 8000,
                image: 'https://example.com/jacket-leather.jpg',
                category: 'jackets',
                description: 'Стильная кожаная куртка чёрного цвета',
                sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
                composition: JSON.stringify({
                    leather: 100,
                }),
                discount: 20,
            },
        });
        console.log('✅ Куртка добавлена:', jacket);

        // Пример 4: Добавление шапки
        const hat = await prisma.product.create({
            data: {
                name: 'Вязаная шапка',
                price: 800,
                image: 'https://example.com/hat-knit.jpg',
                category: 'hats',
                description: 'Тёплая вязаная шапка на зиму',
                sizes: JSON.stringify(['One Size']),
                composition: JSON.stringify({
                    acrylic: 100,
                }),
            },
        });
        console.log('✅ Шапка добавлена:', hat);

        // Пример 5: Добавление обуви
        const shoes = await prisma.product.create({
            data: {
                name: 'Кроссовки спортивные',
                price: 5000,
                image: 'https://example.com/shoes-sneakers.jpg',
                category: 'shoes',
                description: 'Удобные спортивные кроссовки',
                sizes: JSON.stringify(['36', '37', '38', '39', '40', '41', '42', '43', '44', '45']),
                composition: JSON.stringify({
                    textile: 60,
                    rubber: 40,
                }),
            },
        });
        console.log('✅ Обувь добавлена:', shoes);

        // Пример 6: Добавление товара со скидкой (попадёт в SALE автоматически)
        const saleItem = await prisma.product.create({
            data: {
                name: 'Льняная рубашка',
                price: 1200,
                image: 'https://example.com/shirt-sale.jpg',
                category: 'tshirts',
                description: 'Льняная рубашка со скидкой',
                sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
                composition: JSON.stringify({
                    linen: 100,
                }),
                discount: 50,
            },
        });
        console.log('✅ Товар со скидкой добавлен:', saleItem);

        console.log('\n✨ Все тестовые товары успешно добавлены!');

        // Вывод всех товаров
        const allProducts = await prisma.product.findMany();
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
