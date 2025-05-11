import express, {Request, Response} from 'express';
import cors from 'cors';
import {router} from './modulo';

// Cria aplicação Express
const app = express();

// Middlewares
app.use(cors()); // Permite requisições cross-origin
app.use(express.json()); // Parseia corpos JSON
app.use(express.urlencoded({extended: true})); // Parseia formulários

// Registra rotas
app.use('/api', router);

// Rota de teste
app.get('/', (req: Request, res: Response) => {
    res.json({message: 'API do Sistema Hospitalar está rodando!'});
});

// Inicia servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

export default app;