import { Router } from 'express';
import * as triagemController from '../controllers/triagemController';

const router = Router();
router.post('/', triagemController.HandlerRealizarTriagem);
router.get('/queue', triagemController.HandlerGetQueue);
export default router;