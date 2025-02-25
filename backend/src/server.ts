import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import authRoutes from './features/auth/routes/authRoutes';
import pepRoutes from './features/pep/routes/pepRoutes';
import triagemRoutes from './features/triagem/routes/triagemRoutes';
import agendamentoRoutes from './features/agendamento/routes/agendamentoRoutes';
import prescricaoRoutes from './features/prescricao/routes/prescricaoRoutes';
import { initWebSocket } from './features/pep/controllers/pepController';
import { authMiddleware } from './middlewares/authMiddleware';
import unidadesSaudeRoutes from './features/unidades/routes/unidadeSaudeRoutes';
import professionalRoutes from './features/profissional/routes/professionalRoutes';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: '*' },
});

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/pep', authMiddleware, pepRoutes);
app.use('/api/triagem', authMiddleware, triagemRoutes);
app.use('/api/agendamento', authMiddleware, agendamentoRoutes);
app.use('/api/prescricao', authMiddleware, prescricaoRoutes);
app.use('/api/unidades_saude', authMiddleware, unidadesSaudeRoutes);
app.use('/api/profissionais', authMiddleware, professionalRoutes);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Erro:', err.message);
    const status = err.message.includes('Token') ? 401 : 500;
    res.status(status).json({ error: err.message });
});

initWebSocket(io);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));