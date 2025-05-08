import {Router} from 'express';
import {ConsultaController} from '../controller/ConsultaController';
import {requireAuth, restrictTo} from '../../../middleware/auth';
import {Papeis} from '../../core/model/Enums';

const router = Router();
const consultaController = new ConsultaController();

// Rotas para Consultas
router.post('/', requireAuth, restrictTo(Papeis.MEDICO, Papeis.ADMINISTRADOR_PRINCIPAL), consultaController.create.bind(consultaController));
router.get('/:id', requireAuth, restrictTo(Papeis.MEDICO, Papeis.ADMINISTRADOR_PRINCIPAL), consultaController.get.bind(consultaController));
router.get('/paciente/:pacienteId', requireAuth, restrictTo(Papeis.MEDICO, Papeis.ADMINISTRADOR_PRINCIPAL), consultaController.listByPaciente.bind(consultaController));
router.get('/profissional/:profissionalId', requireAuth, restrictTo(Papeis.ADMINISTRADOR_PRINCIPAL), consultaController.listByProfissional.bind(consultaController));
router.get('/unidade/:unidadeSaudeId/atendimentos-ativos', requireAuth, restrictTo(Papeis.ADMINISTRADOR_PRINCIPAL), consultaController.listAtendimentosAtivos.bind(consultaController));
router.get('/unidade/:unidadeSaudeId', requireAuth, restrictTo(Papeis.ADMINISTRADOR_PRINCIPAL), consultaController.listByUnidadeSaude.bind(consultaController));

export {router};