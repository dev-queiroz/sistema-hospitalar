// @ts-ignore
import request from 'supertest';
import {describe, it} from "node:test";
import {expect} from "@jest/globals";

const BASE_URL = 'https://sistema-hospitalar.onrender.com';
const prontuarioId = '7a051280-a49e-4d52-8213-2d6e6d10d622';
const token = 'eyJhbGciOiJIUzI1NiIsImtpZCI6Imorc1l4RmljVjBqenZmL0kiLCJ0eXAiOiJKV1Q...'; // token real (resumido)

describe('📄 PDF - Geração de prontuário', () => {
    it('deve retornar o PDF com status 200 e tipo application/pdf', async () => {
        const res = await request(BASE_URL)
            .get(`/api/prontuarios/${prontuarioId}/pdf`)
            .set('Authorization', `Bearer ${token}`)
            .expect('Content-Type', /application\/pdf/)
            .expect('Content-Disposition', /attachment; filename=prontuario_/)
            .expect(200);

        expect(res.body).toBeDefined();
        expect(Buffer.isBuffer(res.body)).toBe(true);
        expect(res.headers['content-type']).toBe('application/pdf');

        if (res.status === 200 && Buffer.isBuffer(res.body)) {
            require('fs').writeFileSync('prontuario_teste.pdf', res.body);
        }
    });

    it('deve retornar 401 se o token não for enviado', async () => {
        await request(BASE_URL)
            .get(`/api/prontuarios/${prontuarioId}/pdf`)
            .expect(401);
    });

    it('deve retornar 404 se o prontuário não existir', async () => {
        const res = await request(BASE_URL)
            .get(`/api/prontuarios/nao-existe/pdf`)
            .set('Authorization', `Bearer ${token}`)
            .expect(404);

        expect(res.body.error).toMatch(/Prontuário não encontrado/i);
    });
});