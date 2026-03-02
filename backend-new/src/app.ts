import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import authRoutes from './routes/authRoutes.js';
import browserUserRoutes from './routes/browserUserRoutes.js';
import cdekRoutes from './routes/cdekRoutes.js';
import { logger } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';

export function buildApp() {
    const app = express();

    // Middleware
    app.use(cors({
        origin: process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) ?? [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
        ],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    }));
    app.use(express.json());
    app.use(cookieParser());
    app.use(logger);

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/browser-users', browserUserRoutes);
    app.use('/api/cdek', cdekRoutes);

    // Health check
    app.get('/api/health', (_req, res) => {
        res.json({ status: 'OK' });
    });

    // Error handler (должен быть последним)
    app.use(errorHandler);

    return app;
}
