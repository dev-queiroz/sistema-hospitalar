import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import authRoutes from './features/auth/routes/authRoutes';
import pepRoutes from './features/pep/routes/pepRoutes';
import triagemRoutes from './features/triagem/routes/triagemRoutes';
import agendamentoRoutes from './features/agendamento/routes/agendamentoRoutes';
import prescricaoRoutes from './features/prescricao/routes/prescricaoRoutes';
import { initWebSocket } from './features/pep/controllers/pepController';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
    },
});

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/pep', pepRoutes);
app.use('/api/triagem', triagemRoutes);
app.use('/api/agendamento', agendamentoRoutes);
app.use('/api/prescricao', prescricaoRoutes);

initWebSocket(io);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));