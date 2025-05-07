import {z} from 'zod';
import {TipoUnidadeSaude} from './core/model/Enums';

// Validações reutilizáveis
const CpfSchema = z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos');
const CnsSchema = z.string().regex(/^\d{15}$/, 'CNS deve ter 15 dígitos');
const CnesSchema = z.string().regex(/^\d{7}$/, 'CNES deve ter 7 dígitos');
const CepSchema = z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos');
const TelefoneSchema = z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos');
const EnderecoSchema = z.object({
    logradouro: z.string().min(1, 'Logradouro é obrigatório'),
    numero: z.string().min(1, 'Número é obrigatório'),
    complemento: z.string().optional(),
    bairro: z.string().min(1, 'Bairro é obrigatório'),
    cidade: z.string().min(1, 'Cidade é obrigatória'),
    estado: z.string().length(2, 'Estado deve ter 2 caracteres'),
    cep: CepSchema,
});
const EmailSchema = z.string().email('Email inválido').optional();
const Cid10Schema = z.string().regex(/^[A-Z]\d{2}(\.\d{1,2})?$/, 'CID10 inválido').optional();

// 1. UnidadeSaude DTOs
export const CreateUnidadeSaudeDTO = z.object({
    nome: z.string().min(1, 'Nome é obrigatório'),
    tipo: z.enum([TipoUnidadeSaude.UBS, TipoUnidadeSaude.UPA, TipoUnidadeSaude.Hospital], {
        errorMap: () => ({message: 'Tipo inválido (UBS, UPA, HOSPITAL)'}),
    }),
    cnes: CnesSchema,
    endereco: EnderecoSchema,
    telefone: TelefoneSchema,
    servicosEssenciais: z.array(z.string()).min(1, 'Pelo menos um serviço essencial é necessário'),
    servicosAmpliados: z.array(z.string()).optional(),
});

export const UpdateUnidadeSaudeDTO = CreateUnidadeSaudeDTO.partial();

// 2. Paciente DTOs
export const CreatePacienteDTO = z.object({
    nome: z.string().min(1, 'Nome é obrigatório'),
    cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
    cns: z.string().regex(/^\d{15}$/, 'CNS deve ter 15 dígitos'),
    dataNascimento: z.string().transform((val) => new Date(val)).refine((val) => !isNaN(val.getTime()), 'Data de nascimento inválida'),
    sexo: z.string().min(1, 'Sexo é obrigatório'),
    racaCor: z.string().min(1, 'Raça/Cor é obrigatória'),
    escolaridade: z.string().min(1, 'Escolaridade é obrigatória'),
    endereco: z.object({
        logradouro: z.string().min(1, 'Logradouro é obrigatório'),
        numero: z.string().min(1, 'Número é obrigatório'),
        complemento: z.string().optional(),
        bairro: z.string().min(1, 'Bairro é obrigatório'),
        cidade: z.string().min(1, 'Cidade é obrigatória'),
        estado: z.string().min(1, 'Estado é obrigatório'),
        cep: z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos'),
    }),
    telefone: z.string().min(1, 'Telefone é obrigatório'),
    gruposRisco: z.array(z.string()).min(1, 'Grupos de risco são obrigatórios'),
    consentimentoLGPD: z.boolean().refine((val) => val === true, 'Consentimento LGPD é obrigatório'),
    email: z.string().email('Email inválido').optional(),
});

export const UpdatePacienteDTO = CreatePacienteDTO.partial().extend({
    consentimentoLGPD: z.boolean().refine((val) => val !== false, 'Consentimento LGPD não pode ser revogado').optional(),
});

// 3. Medico DTOs
export const CreateMedicoDTO = CreatePacienteDTO.extend({
    dataContratacao: z.string().transform((val) => new Date(val)).refine((val) => !isNaN(val.getTime()), 'Data de contratação inválida'),
    crm: z.string().min(1, 'CRM é obrigatório'),
}).omit({gruposRisco: true, consentimentoLGPD: true});

export const UpdateMedicoDTO = z.object({
    nome: z.string().min(1, 'Nome é obrigatório').optional(),
    crm: z.string().min(1, 'CRM é obrigatório').optional(),
    dataContratacao: z.string().transform((val) => new Date(val)).refine((val) => !isNaN(val.getTime()), 'Data de contratação inválida').optional(),
});

// 4. Enfermeiro DTOs
export const CreateEnfermeiroDTO = CreatePacienteDTO.extend({
    dataContratacao: z.string().transform((val) => new Date(val)).refine((val) => !isNaN(val.getTime()), 'Data de contratação inválida'),
    coren: z.string().min(1, 'COREN é obrigatório'),
}).omit({gruposRisco: true, consentimentoLGPD: true});

export const UpdateEnfermeiroDTO = z.object({
    nome: z.string().min(1, 'Nome é obrigatório').optional(),
    coren: z.string().min(1, 'COREN é obrigatório').optional(),
    dataContratacao: z.string().transform((val) => new Date(val)).refine((val) => !isNaN(val.getTime()), 'Data de contratação inválida').optional(),
});

// 5. Prontuario DTOs
export const CreateProntuarioDTO = z.object({
    pacienteId: z.string().uuid('ID do paciente inválido'),
    profissionalId: z.string().uuid('ID do profissional inválido'),
    descricao: z.string().min(1, 'Descrição é obrigatória'),
    dadosAnonimizados: z.boolean().default(false),
});

export const UpdateProntuarioDTO = CreateProntuarioDTO.partial();

// 6. Prescricao DTOs
export const CreatePrescricaoDTO = z.object({
    pacienteId: z.string().uuid('ID do paciente inválido'),
    profissionalId: z.string().uuid('ID do profissional inválido'),
    detalhesPrescricao: z.string().min(1, 'Detalhes da prescrição são obrigatórios'),
    cid10: Cid10Schema,
});

export const UpdatePrescricaoDTO = CreatePrescricaoDTO.partial();

// 7. Consulta DTOs
export const CreateConsultaDTO = z.object({
    pacienteId: z.string().uuid('ID do paciente inválido'),
    profissionalId: z.string().uuid('ID do profissional inválido'),
    unidadeSaudeId: z.string().uuid('ID da unidade de saúde inválido'),
    observacoes: z.string().min(1, 'Observações são obrigatórias'),
    quartoId: z.string().uuid('ID do quarto inválido').optional(),
    cid10: Cid10Schema,
});

export const UpdateConsultaDTO = CreateConsultaDTO.partial();

// 8. Triagem DTOs
export const SinaisVitaisSchema = z.object({
    pressaoArterial: z.string().regex(/^\d{2,3}\/\d{2,3}$/, 'Pressão arterial inválida (ex.: 120/80)'),
    frequenciaCardiaca: z.number().min(0, 'Frequência cardíaca inválida'),
    temperatura: z.number().min(0, 'Temperatura inválida'),
    saturacaoOxigenio: z.number().min(0, 'Saturação de oxigênio inválida'),
});

export const CreateTriagemDTO = z.object({
    pacienteId: z.string().uuid('ID do paciente inválido'),
    enfermeiroId: z.string().uuid('ID do enfermeiro inválido'),
    unidadeSaudeId: z.string().uuid('ID da unidade de saúde inválido'),
    sinaisVitais: SinaisVitaisSchema,
    queixaPrincipal: z.string().min(1, 'Queixa principal é obrigatória'),
    quartoId: z.string().uuid('ID do quarto inválido').optional(),
});

export const UpdateTriagemDTO = CreateTriagemDTO.partial();

// 9. Quarto DTOs
export const CreateQuartoDTO = z.object({
    numero: z.string().min(1, 'Número do quarto é obrigatório'),
    unidadeSaudeId: z.string().uuid('ID da unidade de saúde inválido'),
});

export const UpdateQuartoDTO = CreateQuartoDTO.partial();

// 10. Leito DTOs
export const CreateLeitoDTO = z.object({
    numero: z.string().min(1, 'Número do leito é obrigatório'),
    quartoId: z.string().uuid('ID do quarto inválido'),
});

export const UpdateLeitoDTO = z.object({
    numero: z.string().min(1, 'Número do leito é obrigatório').optional(),
    disponivel: z.boolean().optional(),
});

// Exportar tipos para TypeScript
export type CreateUnidadeSaudeDTO = z.infer<typeof CreateUnidadeSaudeDTO>;
export type UpdateUnidadeSaudeDTO = z.infer<typeof UpdateUnidadeSaudeDTO>;
export type CreatePacienteDTO = z.infer<typeof CreatePacienteDTO>;
export type UpdatePacienteDTO = z.infer<typeof UpdatePacienteDTO>;
export type CreateMedicoDTO = z.infer<typeof CreateMedicoDTO>;
export type UpdateMedicoDTO = z.infer<typeof UpdateMedicoDTO>;
export type CreateEnfermeiroDTO = z.infer<typeof CreateEnfermeiroDTO>;
export type UpdateEnfermeiroDTO = z.infer<typeof UpdateEnfermeiroDTO>;
export type CreateProntuarioDTO = z.infer<typeof CreateProntuarioDTO>;
export type UpdateProntuarioDTO = z.infer<typeof UpdateProntuarioDTO>;
export type CreatePrescricaoDTO = z.infer<typeof CreatePrescricaoDTO>;
export type UpdatePrescricaoDTO = z.infer<typeof UpdatePrescricaoDTO>;
export type CreateConsultaDTO = z.infer<typeof CreateConsultaDTO>;
export type UpdateConsultaDTO = z.infer<typeof UpdateConsultaDTO>;
export type CreateTriagemDTO = z.infer<typeof CreateTriagemDTO>;
export type UpdateTriagemDTO = z.infer<typeof UpdateTriagemDTO>;
export type CreateQuartoDTO = z.infer<typeof CreateQuartoDTO>;
export type UpdateQuartoDTO = z.infer<typeof UpdateQuartoDTO>;
export type CreateLeitoDTO = z.infer<typeof CreateLeitoDTO>;
export type UpdateLeitoDTO = z.infer<typeof UpdateLeitoDTO>;