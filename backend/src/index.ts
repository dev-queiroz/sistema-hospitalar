import 'reflect-metadata';
import express from 'express';
import app from './app';

const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});