import { Router } from 'express';
import * as unidadeSaudeController from '../controllers/unidadeSaudeController';

const router = Router();
router.post('/', unidadeSaudeController.HandlerCreateUnidadeSaude);
router.get('/', unidadeSaudeController.HandlerGetUnidadesSaude);
router.put('/:id', unidadeSaudeController.HandlerUpdateUnidadeSaude);
router.delete('/:id', unidadeSaudeController.HandlerDeleteUnidadeSaude);
export default router;