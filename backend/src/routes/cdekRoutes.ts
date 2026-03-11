import { Router } from 'express';
import { CdekController } from '../controllers/cdekController.js';

const router = Router();

// Поиск городов
router.get('/cities', CdekController.getCities);

// Список ПВЗ по городу
router.get('/pvz', CdekController.getPvz);

// Расчёт стоимости доставки
router.post('/calc', CdekController.calcDelivery);

export default router;
