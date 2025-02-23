import { Router } from 'express';
import * as prescricaoController from '../controllers/prescricaoController';

const router = Router();

router.post('/prescricao', prescricaoController.HandlerCriarPrescricao);
router.post('/encaminhamento', prescricaoController.HandlerCriarEncaminhamento);

export default router;