import express from 'express';
import unidadeRouter from './packages/unidade/unidade.routes';

const app = express();

app.use(express.json());
app.use('/unidades', unidadeRouter);

export default app;