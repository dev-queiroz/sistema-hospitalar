import express, {Request, Response} from 'express';
import cors from 'cors';
import {router} from './modulo';

const app = express();

app.use(cors(
    {origin: '*'}
));
app.use(express.json());
app.use(express.urlencoded({extended: true}));


app.use('/api', router);


app.get('/', (req: Request, res: Response) => {
    res.json({message: 'API do Sistema Hospitalar está rodando!'});
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

export default app;