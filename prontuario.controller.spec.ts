import * as request from 'supertest';
import * as express from 'express';
import {router} from './backend/src/modulo/prontuario/routes/prontuarioRoutes';
import * as fs from 'fs';
import {Server} from 'http';
import {ProntuarioService} from './backend/src/modulo/prontuario/service/ProntuarioService';
import {PacienteService} from './backend/src/modulo/paciente/service/PacienteService';
import {TriagemService} from './backend/src/modulo/triagem/service/TriagemService';
import {supabaseClient} from './backend/src/shared/database/supabase';
import {compileLatexToPDF} from './backend/src/utils/pdfCompiler';
import {Papeis} from './backend/src/modulo/core/model/Enums';

jest.mock('./backend/src/modulo/prontuario/service/ProntuarioService');
jest.mock('./backend/src/modulo/paciente/service/PacienteService');
jest.mock('./backend/src/modulo/triagem/service/TriagemService');
jest.mock('./backend/src/shared/database/supabase');
jest.mock('./backend/src/utils/pdfCompiler');

describe('📄 PDF - Geração de prontuário', () => {
    let app: express.Application;
    let server: Server;
    const prontuarioId = '7a051280-a49e-4d52-8213-2d6e6d10d622';
    const token = 'eyJhbGciOiJIUzI1NiIsImtpZCI6Imorc1l4RmljVjBqenZmL0kiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2djeXNyaHZ0Ym9iZWt1enBzZnd1LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJhZjA1ZGQ1OS01MzIzLTRkYjktYTY3OS1iZjkwOGUxZWQwMzkiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUwMzUwNDc3LCJpYXQiOjE3NTAzNDY4NzcsImVtYWlsIjoicml6ZXB1cnBsZTlAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6InJpemVwdXJwbGU5QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJub21lIjoiSm_Do28gU2FudG9zIiwicGFwZWwiOiJFTkZFUk1FSVJPIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiJhZjA1ZGQ1OS01MzIzLTRkYjktYTY3OS1iZjkwOGUxZWQwMzkifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc1MDM0Njg3N31dLCJzZXNzaW9uX2lkIjoiMGI0ZTE3ODktMzFiYy00MDk4LWI5MmItZWZmN2IyYWY1Yjk2IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.e1iT2i3i93MTkRzgH32OBRtQnahRv-mtl0iKl4_tnfE';

    beforeAll((done) => {
        app = express();
        app.use(express.json());
        // Mock middleware de autenticação
        app.use((req: any, res, next) => {
            req.user = {id: 'af05dd59-5323-4db9-a679-bf90b8e1ed039', papel: Papeis.ENFERMEIRO};
            next();
        });
        app.use('/api/prontuarios', router);
        server = app.listen(0, done);
    });

    afterAll((done) => {
        server.close(done);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('deve retornar o PDF com status 200 e tipo application/pdf', async () => {
        // Mock dados
        (ProntuarioService.prototype.getProntuario as jest.Mock).mockResolvedValue({
            data: {
                id: prontuarioId,
                pacienteId: 'paciente1',
                profissionalId: 'prof1',
                unidadeSaudeId: 'unidade1',
                descricao: 'Prescrição criada em 05/06/2025. Detalhes: vitacid 0,05g. CID-10: J45',
            },
            error: null,
        });

        (PacienteService.prototype.getPaciente as jest.Mock).mockResolvedValue({
            data: {
                id: 'paciente1',
                nome: 'Ana',
                cpf: '09245682348',
                cns: '123456789012312',
                dataNascimento: '2000-02-02',
            },
            error: null,
        });

        (supabaseClient.from as jest.Mock).mockImplementation((table: string) => {
            if (table === 'funcionario') {
                return {
                    select: () => ({
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: {nome: 'Luis Inacio', papel: Papeis.MEDICO, crm: '54322-SP'},
                            error: null,
                        }),
                    }),
                };
            }
            if (table === 'unidade_saude') {
                return {
                    select: () => ({
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: {nome: 'Hospital Central', telefone: '11999999999'},
                            error: null,
                        }),
                    }),
                };
            }
        });

        (TriagemService.prototype.listTriagensByPaciente as jest.Mock).mockResolvedValue({
            data: [
                {createdAt: '2025-06-19T00:00:00Z', queixaPrincipal: 'Febre', nivelGravidade: 'VERDE'},
                {createdAt: '2025-06-19T00:00:00Z', queixaPrincipal: 'Dor de cabeça leve', nivelGravidade: 'VERDE'},
            ],
            error: null,
        });

        (compileLatexToPDF as jest.Mock).mockResolvedValue(Buffer.from('mocked_pdf_content'));

        const res = await request(app)
            .get(`/api/prontuarios/${prontuarioId}/pdf`)
            .set('Authorization', `Bearer ${token}`)
            .responseType('blob');

        if (res.status !== 200) {
            console.error('Erro:', res.body);
        }

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/application\/pdf/);
        expect(res.headers['content-disposition']).toMatch(/attachment; filename=prontuario_/);
        expect(res.body).toBeInstanceOf(Buffer);

        // Grava o PDF local para inspeção (apenas em sucesso)
        if (res.status === 200 && Buffer.isBuffer(res.body)) {
            fs.writeFileSync('prontuario_teste.pdf', res.body);
        }
    });

    it('deve retornar 401 se o token não for enviado', async () => {
        const res = await request(app)
            .get(`/api/prontuarios/${prontuarioId}/pdf`)
            .expect(401);

        expect(res.body.error).toMatch(/Unauthorized/i);
    });

    it('deve retornar 404 se o prontuário não existir', async () => {
        (ProntuarioService.prototype.getProntuario as jest.Mock).mockResolvedValue({
            data: null,
            error: 'Prontuário não encontrado',
        });

        const res = await request(app)
            .get(`/api/prontuarios/nao-existe/pdf`)
            .set('Authorization', `Bearer ${token}`)
            .expect(404);

        expect(res.body.error).toMatch(/Prontuário não encontrado/i);
    });
});