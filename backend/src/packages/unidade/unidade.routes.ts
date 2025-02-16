import { Router } from 'express';
import { UnidadeController } from './controller/UnidadeController';

const router = Router();
const unidadeController = new UnidadeController();

router.post('/', unidadeController.criar);
router.get('/', unidadeController.listar);
router.get('/:id', unidadeController.buscarPorId);
router.put('/:id', unidadeController.atualizar);
router.delete('/:id', unidadeController.excluir);

export default router;
