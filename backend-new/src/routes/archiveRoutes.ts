import { Router } from 'express';
import { ArchiveController } from '../controllers/archiveController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, ArchiveController.getAllArchive);
router.get('/:id', authMiddleware, ArchiveController.getArchiveById);
router.post('/', authMiddleware, ArchiveController.createArchive);
router.post('/:id/restore', authMiddleware, ArchiveController.restoreFromArchive);
router.delete('/:id', authMiddleware, ArchiveController.deleteArchive);

export default router;
