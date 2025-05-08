import {Router} from 'express';
import {UnidadeSaudeController} from '../controller/UnidadeSaudeController';
import {requireAuth, restrictTo} from '../../../middleware/auth';
import {Papeis} from '../../core/model/Enums';

const router = Router();
const unidadeSaudeController = new UnidadeSaudeController();

// Rotas para Unidades de Saúde
router.post('/', requireAuth, restrictTo(Papeis.ADMINISTRADOR_PRINCIPAL), unidadeSaudeController.create.bind(unidadeSaudeController));
router.get('/:id', requireAuth, restrictTo(Papeis.ADMINISTRADOR_PRINCIPAL), unidadeSaudeController.get.bind(unidadeSaudeController));
router.put('/:id', requireAuth, restrictTo(Papeis.ADMINISTRADOR_PRINCIPAL), unidadeSaudeController.update.bind(unidadeSaudeController));
router.delete('/:id', requireAuth, restrictTo(Papeis.ADMINISTRADOR_PRINCIPAL), unidadeSaudeController.delete.bind(unidadeSaudeController));
router.get('/', requireAuth, restrictTo(Papeis.ADMINISTRADOR_PRINCIPAL), unidadeSaudeController.list.bind(unidadeSaudeController));
router.get('/:unidadeSaudeId/funcionarios', requireAuth, restrictTo(Papeis.ADMINISTRADOR_PRINCIPAL), unidadeSaudeController.listFuncionariosByUnidade.bind(unidadeSaudeController));

export {router};