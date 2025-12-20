import {Router} from 'express';
import {router as authRoutes} from './auth/routes/authRoutes';
import {router as consultaRoutes} from './consulta/routes/consultaRoutes';
import {router as enfermeiroRoutes} from './enfermeiro/routes/enfermeiroRoutes';
import {router as medicoRoutes} from './medico/routes/medicoRoutes';
import {router as pacienteRoutes} from './paciente/routes/pacienteRoutes';
import {router as prescricaoRoutes} from './prescricao/routes/prescricaoRoutes';
import {router as prontuarioRoutes} from './prontuario/routes/prontuarioRoutes';
import {router as triagemRoutes} from './triagem/routes/triagemRoutes';
import {router as unidadeSaudeRoutes} from './unidade-saude/routes/unidadeSaudeRoutes';
import {router as iaRoutes} from './ia/routes/iaRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/consultas', consultaRoutes);
router.use('/enfermeiros', enfermeiroRoutes);
router.use('/medicos', medicoRoutes);
router.use('/pacientes', pacienteRoutes);
router.use('/prescricoes', prescricaoRoutes);
router.use('/prontuarios', prontuarioRoutes);
router.use('/triagens', triagemRoutes);
router.use('/unidades-saude', unidadeSaudeRoutes);
router.use('/ia', iaRoutes);

export {router};