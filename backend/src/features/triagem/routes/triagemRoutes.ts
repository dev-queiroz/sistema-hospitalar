import { Router } from 'express';
import * as triagemController from '../controllers/triagemController';

const router = Router();

router.post('/', triagemController.HandlerRealizarTriagem);

export default router;