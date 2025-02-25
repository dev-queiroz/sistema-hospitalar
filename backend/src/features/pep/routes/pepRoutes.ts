import { Router } from 'express';
import * as pepController from '../controllers/pepController';
import { offlineMiddleware } from '../../offline/services/offlineService';

const router = Router();
router.post('/', offlineMiddleware('prontuarios'), pepController.HandlerCreateProntuario);
router.get('/:patientId', pepController.HandlerGetProntuario);
router.get('/list', pepController.HandlerListProntuarios);
router.get('/realtime', pepController.HandlerStartRealtime);
router.get('/call', pepController.HandlerCallPatient);
router.post('/attend', offlineMiddleware('prontuarios'), pepController.HandlerAttendPatient);

export default router;