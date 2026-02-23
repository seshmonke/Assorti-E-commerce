import express from 'express';
import cors from 'cors';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { logger } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';

export function buildApp() {
    const app = express();

    // Middleware
    app.use(cors({
        origin: process.env.CORS_ORIGIN?.split(',') ?? [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
        ],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    app.use(express.json());
    app.use(logger);

    // Routes
    app.use('/api/products', productRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/payments', paymentRoutes);

    // Health check
    app.get('/health', (_req, res) => {
        res.json({ status: 'OK' });
    });

    // Error handler (должен быть последним)
    app.use(errorHandler);

    return app;
}
