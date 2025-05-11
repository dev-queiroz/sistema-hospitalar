import {z} from 'zod';
import {Escolaridade, NivelGravidade, RacaCor, Sexo, TipoUnidadeSaude} from './model/Enums';

const GRUPOS_RISCO_PERMITIDOS = ['IDOSO', 'GESTANTE', 'DIABETICO', 'HIPERTENSO', 'IMUNOSSUPRIMIDO', 'CRIANCA'];

export const EnderecoDTO = z.object({
    logradouro: z.string().min(1, 'Logradouro é obrigatório'),
    numero: z.string().min(1, 'Número é obrigatório'),
    bairro: z.string().min(1, 'Bairro é obrigatório'),
    cidade: z.string().min(1, 'Cidade é obrigatória'),
    estado: z.string().min(1, 'Estado é obrigatório'),
    cep: z.string().regex(/^\d{8}$/, 'CEP inválido (deve ter 8 dígitos)'),
});

// 1. UnidadeSaude DTOs
export const CreateUnidadeSaudeDTO = z.object({
    nome: z.string().min(1, 'Nome é obrigatório'),
    tipo: z.enum([TipoUnidadeSaude.UBS, TipoUnidadeSaude.UPA, TipoUnidadeSaude.Hospital]),
    cnes: z.string().regex(/^\d{7}$/, 'CNES deve ter 7 dígitos'),
    endereco: z.object({
        logradouro: z.string().min(1, 'Logradouro é obrigatório'),
        numero: z.string().min(1, 'Número é obrigatório'),
        complemento: z.string().optional(),
        bairro: z.string().min(1, 'Bairro é obrigatório'),
        cidade: z.string().min(1, 'Cidade é obrigatória'),
        estado: z.string().length(2, 'Estado deve ter 2 caracteres'),
        cep: z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos'),
    }),
    telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
    servicosEssenciais: z.array(z.string()).min(1, 'Pelo menos um serviço essencial é necessário'),
    servicosAmpliados: z.array(z.string()).optional(),
});

export const UpdateUnidadeSaudeDTO = CreateUnidadeSaudeDTO.partial();

// 2. Paciente DTOs
export const CreatePacienteDTO = z.object({
    nome: z.string().min(1, 'Nome é obrigatório'),
    cpf: z.string().regex(/^\d{11}$/, 'CPF inválido (deve ter 11 dígitos)'),
    cns: z.string().regex(/^\d{15}$/, 'CNS inválido (deve ter 15 dígitos)'),
    dataNascimento: z.string().refine((val) => !isNaN(Date.parse(val)), {message: 'Data de nascimento inválida'}),
    sexo: z.nativeEnum(Sexo, {errorMap: () => ({message: 'Sexo inválido'})}),
    racaCor: z.nativeEnum(RacaCor, {errorMap: () => ({message: 'Raça/Cor inválida'})}),
    escolaridade: z.nativeEnum(Escolaridade, {errorMap: () => ({message: 'Escolaridade inválida'})}),
    endereco: EnderecoDTO,
    telefone: z.string().regex(/^\d{10,11}$/, 'Telefone inválido (deve ter 10 ou 11 dígitos)'),
    email: z.string().email('Email inválido').optional(),
    gruposRisco: z
        .array(z.enum(GRUPOS_RISCO_PERMITIDOS as any))
        .min(1, 'Pelo menos um grupo de risco é obrigatório'),
    consentimentoLGPD: z.boolean({required_error: 'Consentimento LGPD é obrigatório'}),
    unidadeSaudeId: z.string().uuid('ID da unidade de saúde inválido').optional(),
});

export const UpdatePacienteDTO = z.object({
    nome: z.string().min(1, 'Nome é obrigatório').optional(),
    cpf: z.string().regex(/^\d{11}$/, 'CPF inválido (deve ter 11 dígitos)').optional(),
    cns: z.string().regex(/^\d{15}$/, 'CNS inválido (deve ter 15 dígitos)').optional(),
    dataNascimento: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {message: 'Data de nascimento inválida'})
        .optional(),
    sexo: z.nativeEnum(Sexo, {errorMap: () => ({message: 'Sexo inválido'})}).optional(),
    racaCor: z.nativeEnum(RacaCor, {errorMap: () => ({message: 'Raça/Cor inválida'})}).optional(),
    escolaridade: z.nativeEnum(Escolaridade, {errorMap: () => ({message: 'Escolaridade inválida'})}).optional(),
    endereco: EnderecoDTO.optional(),
    telefone: z.string().regex(/^\d{10,11}$/, 'Telefone inválido (deve ter 10 ou 11 dígitos)').optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    gruposRisco: z
        .array(z.enum(GRUPOS_RISCO_PERMITIDOS as any))
        .min(1, 'Pelo menos um grupo de risco é obrigatório')
        .optional(),
    consentimentoLGPD: z.boolean({required_error: 'Consentimento LGPD é obrigatório'}).optional(),
    unidadeSaudeId: z.string().uuid('ID da unidade de saúde inválido').optional(),
});

// 3. Medico DTOs
export const CreateMedicoDTO = CreatePacienteDTO.extend({
    dataContratacao: z.string().transform((val) => new Date(val)).refine((val) => !isNaN(val.getTime()), 'Data de contratação inválida'),
    crm: z.string().min(1, 'CRM é obrigatório'),
    senha: z.string().min(5, 'Senha deve ter pelo menos 5 caracteres'),
    email: z.string().email('Email inválido').optional(),
    unidadeSaudeId: z.string().uuid('ID da unidade inválido').optional(),
}).omit({gruposRisco: true, consentimentoLGPD: true});

export const UpdateMedicoDTO = z.object({
    nome: z.string().min(1, 'Nome é obrigatório').optional(),
    crm: z.string().min(1, 'CRM é obrigatório').optional(),
    dataContratacao: z.string().transform((val) => new Date(val)).refine((val) => !isNaN(val.getTime()), 'Data de contratação inválida').optional(),
});

// 4. Enfermeiro DTOs
export const CreateEnfermeiroDTO = z.object({
    nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
    cns: z.string().regex(/^\d{15}$/, 'CNS deve ter 15 dígitos'),
    dataNascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento inválida'),
    sexo: z.enum(['MASCULINO', 'FEMININO', 'OUTRO'], {message: 'Sexo inválido'}),
    racaCor: z.enum(['BRANCA', 'PRETA', 'PARDA', 'AMARELA', 'INDIGENA'], {message: 'Raça/Cor inválida'}),
    escolaridade: z.enum(['FUNDAMENTAL', 'MEDIO', 'SUPERIOR', 'POS_GRADUACAO'], {message: 'Escolaridade inválida'}),
    endereco: z.object({
        logradouro: z.string().min(1, 'Logradouro obrigatório'),
        numero: z.string().min(1, 'Número obrigatório'),
        bairro: z.string().min(1, 'Bairro obrigatório'),
        cidade: z.string().min(1, 'Cidade obrigatória'),
        estado: z.string().length(2, 'Estado deve ter 2 caracteres'),
        cep: z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos'),
    }),
    telefone: z.string().regex(/^\d{10,11}$/, 'Telefone inválido'),
    email: z.string().email('Email inválido'),
    senha: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
    dataContratacao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de contratação inválida'),
    coren: z.string().regex(/^\d{6}-[A-Z]{2}$/, 'COREN inválido (ex: 123456-SP)'),
    unidadeSaudeId: z.string().uuid('ID da unidade inválido').optional(),
});

export const UpdateEnfermeiroDTO = z.object({
    nome: z.string().min(1, 'Nome é obrigatório').optional(),
    coren: z.string().min(1, 'COREN é obrigatório').optional(),
    dataContratacao: z.string().transform((val) => new Date(val)).refine((val) => !isNaN(val.getTime()), 'Data de contratação inválida').optional(),
});

// 5. Prontuario DTOs
export const CreateProntuarioDTO = z.object({
    pacienteId: z.string().uuid('ID do paciente inválido'),
    unidadeSaudeId: z.string().uuid('ID da unidade de saúde inválido'),
    descricao: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
    dadosAnonimizados: z.record(z.string()).optional(),
});

export const UpdateProntuarioDTO = z.object({
    descricao: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres').optional(),
    dadosAnonimizados: z.record(z.string()).optional(),
});

// 6. Prescricao DTOs
export const CreatePrescricaoDTO = z.object({
    pacienteId: z.string().uuid('ID do paciente inválido'),
    unidadeSaudeId: z.string().uuid('ID da unidade de saúde inválido'),
    detalhesPrescricao: z.string().min(10, 'Detalhes da prescrição devem ter pelo menos 10 caracteres'),
    cid10: z.string().regex(/^[A-Z]\d{2}(\.\d{1,2})?$/, 'CID-10 inválido (ex.: J45 ou J45.0)'),
});

export const UpdatePrescricaoDTO = z.object({
    detalhesPrescricao: z.string().min(10, 'Detalhes da prescrição devem ter pelo menos 10 caracteres').optional(),
    cid10: z.string().regex(/^[A-Z]\d{2}(\.\d{1,2})?$/, 'CID-10 inválido (ex.: J45 ou J45.0)').optional(),
});

// 7. Consulta DTOs
export const CreateConsultaDTO = z.object({
    pacienteId: z.string().uuid('ID do paciente inválido'),
    unidadeSaudeId: z.string().uuid('ID da unidade de saúde inválido'),
    observacoes: z.string().min(10, 'Observações devem ter pelo menos 10 caracteres'),
    cid10: z.string().regex(/^[A-Z]\d{2}(\.\d{1,2})?$/, 'CID-10 inválido (ex.: J45 ou J45.0)').optional(),
});

export const UpdateConsultaDTO = z.object({
    observacoes: z.string().min(10, 'Observações devem ter pelo menos 10 caracteres').optional(),
    cid10: z.string().regex(/^[A-Z]\d{2}(\.\d{1,2})?$/, 'CID-10 inválido (ex.: J45 ou J45.0)').optional(),
});

// 8. Triagem DTOs
const SinaisVitaisSchema = z.object({
    pressaoArterialSistolica: z.number(),
    pressaoArterialDiastolica: z.number(),
    frequenciaCardiaca: z.number(),
    frequenciaRespiratoria: z.number(),
    temperatura: z.number(),
    saturacaoOxigenio: z.number(),
    nivelDor: z.number(),
    estadoConsciente: z.boolean(),
});

const NivelGravidadeSchema = z.enum([
    NivelGravidade.Vermelho,
    NivelGravidade.Laranja,
    NivelGravidade.Amarelo,
    NivelGravidade.Verde,
    NivelGravidade.Azul,
], {errorMap: () => ({message: 'Nível de gravidade inválido'})});

export const CreateTriagemDTO = z.object({
    pacienteId: z.string().uuid('ID do paciente inválido'),
    enfermeiroId: z.string().uuid('ID do enfermeiro inválido'),
    unidadeSaudeId: z.string().uuid('ID da unidade de saúde inválido'),
    nivelGravidade: NivelGravidadeSchema.optional(),
    sinaisVitais: SinaisVitaisSchema,
    queixaPrincipal: z.string().min(1, 'Queixa principal é obrigatória'),
});

export const UpdateTriagemDTO = CreateTriagemDTO.partial();

export type CreateUnidadeSaudeDTO = z.infer<typeof CreateUnidadeSaudeDTO>;
export type UpdateUnidadeSaudeDTO = z.infer<typeof UpdateUnidadeSaudeDTO>;
export type CreatePacienteDTO = z.infer<typeof CreatePacienteDTO>;
export type UpdatePacienteDTO = z.infer<typeof UpdatePacienteDTO>;
export type CreateMedicoDTO = z.infer<typeof CreateMedicoDTO>;
export type UpdateMedicoDTO = z.infer<typeof UpdateMedicoDTO>;
export type CreateEnfermeiroDTO = z.infer<typeof CreateEnfermeiroDTO>;
export type UpdateEnfermeiroDTO = z.infer<typeof UpdateEnfermeiroDTO>;
export type CreateProntuarioDTO = z.infer<typeof CreateProntuarioDTO>;
export type CreatePrescricaoDTO = z.infer<typeof CreatePrescricaoDTO>;
export type CreateConsultaDTO = z.infer<typeof CreateConsultaDTO>;
export type CreateTriagemDTO = z.infer<typeof CreateTriagemDTO>;
export type UpdateTriagemDTO = z.infer<typeof UpdateTriagemDTO>;