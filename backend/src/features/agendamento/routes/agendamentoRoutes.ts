import { Router } from 'express';
import * as agendamentoController from '../controllers/agendamentoController';

const router = Router();

router.post('/', agendamentoController.HandlerCriarAgendamento);

export default router;