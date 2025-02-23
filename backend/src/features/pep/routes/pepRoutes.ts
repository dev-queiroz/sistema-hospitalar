import { Router } from 'express';
import * as pepController from '../controllers/pepController';

const router = Router();

router.get('/', pepController.HandlerListProntuarios);
router.post('/', pepController.HandlerCreateProntuario);
router.get('/:patientId', pepController.HandlerGetProntuario);
router.get('/realtime', pepController.HandlerStartRealtime);

export default router;