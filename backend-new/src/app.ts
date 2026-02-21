import express from 'express';
import productRoutes from './routes/productRoutes.js';
import { logger } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';

export function buildApp() {
    const app = express();

    // Middleware
    app.use(express.json());
    app.use(logger);

    // Routes
    app.use('/api/products', productRoutes);

    // Health check
    app.get('/health', (_req, res) => {
        res.json({ status: 'OK' });
    });

    // Error handler (должен быть последним)
    app.use(errorHandler);

    return app;
}
