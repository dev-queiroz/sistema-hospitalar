# Documentação Técnica do Banco de Dados – Sistema de Controle Hospitalar

## 1. Visão Geral

O banco de dados do sistema hospitalar suporta a gestão de unidades de saúde (UBS, UPA, hospitais), pacientes,
funcionários (médicos, enfermeiros, administradores), consultas, prescrições, prontuários e triagens. Ele é projetado
para:

- **Integridade**: Garantir dados consistentes e válidos.
- **Segurança**: Proteger informações sensíveis, em conformidade com a LGPD.
- **Desempenho**: Suportar consultas rápidas e transações simultâneas.
- **Escalabilidade**: Atender múltiplas unidades de saúde interligadas.

O banco é relacional, normalizado (3FN), e otimizado para operações hospitalares complexas, com suporte a auditoria,
autenticação e controle de acesso.

---

## 2. Tecnologias Utilizadas

- **SGBD**: PostgreSQL 15, hospedado no Supabase.
- **Plataforma**: Supabase, escolhido por:
   - Interface web para gerenciamento de tabelas e SQL.
   - Autenticação integrada (Supabase Auth).
   - Criptografia de dados em trânsito e repouso.
   - Backups automáticos e replicação.
- **Extensões**:
   - `uuid-ossp`: Gera identificadores UUID para chaves primárias.
- **Tipos de Dados**:
   - `JSONB`: Armazena dados estruturados (ex.: sinais vitais em triagens).
   - `TEXT[]`: Arrays para grupos de risco e serviços.
- **Constraints**:
   - `CHECK`: Valida formatos (ex.: CPF, sexo).
   - `FOREIGN KEY`: Garante integridade referencial.
   - `UNIQUE`: Assegura unicidade (ex.: CPF, email).
- **Índices**: B-Tree para otimizar buscas (ex.: CPF, email).
- **Ferramentas**:
   - Supabase Dashboard: Gerencia tabelas, índices e políticas.
   - Supabase SQL Editor: Executa scripts de criação e manutenção.
- **Autenticação**: Supabase Auth, com JWT para sessões seguras.
- **Segurança**: Row-Level Security (RLS) para controle de acesso por função.

---

## 3. Estrutura do Banco de Dados

O banco possui **7 tabelas**, projetadas em **Terceira Forma Normal (3FN)** para evitar redundâncias e garantir
consistência. Cada tabela tem chaves primárias UUID, constraints para validação, e índices para desempenho.

---

### 3.1. Tabelas

---

#### 3.1.1. funcionario

**Descrição**: Armazena dados de médicos, enfermeiros e administradores, incluindo credenciais e perfil profissional.

**Colunas**:

- `id`: UUID, PK.
- `email`: TEXT, único.
- `password`: TEXT, senha com hash bcryptjs.
- `papel`: TEXT (`MEDICO`, `ENFERMEIRO`, `ADMINISTRADOR_PRINCIPAL`).
- `nome`: TEXT.
- `cpf`: TEXT, único, 11 dígitos.
- `cns`: TEXT, único, 15 dígitos.
- `data_nascimento`: DATE.
- `sexo`: TEXT (`MASCULINO`, `FEMININO`, `OUTRO`).
- `raca_cor`: TEXT (`BRANCA`, `PRETA`, `PARDA`, `AMARELA`, `INDIGENA`, `NAO_DECLARADO`).
- `escolaridade`: TEXT (`SEM_ESCOLARIDADE`, `FUNDAMENTAL`, `MEDIO`, `SUPERIOR`, `POS_GRADUACAO`).
- `crm`: TEXT, opcional.
- `coren`: TEXT, opcional.
- `data_contratacao`: DATE.
- `endereco_logradouro`, `endereco_numero`, `endereco_bairro`, `endereco_cidade`, `endereco_estado`, `endereco_cep`:
  TEXT.
- `endereco_complemento`: TEXT, opcional.
- `telefone`: TEXT, 10+ dígitos.
- `created_at`: TIMESTAMP.

**Constraints**:

- `UNIQUE`: email, cpf, cns.
- `CHECK`: padrões de CPF, CNS, email, estado, CEP, telefone, papel, sexo, raça, escolaridade.

**Índices**:

- PK: `id`.
- Secundário: `idx_funcionario_email`.

---

#### 3.1.2. paciente

**Descrição**: Dados completos dos pacientes, incluindo perfil e consentimento.

**Colunas**:

- `id`: UUID, PK.
- `nome`, `cpf` (único), `cns` (único), `data_nascimento`, `sexo`, `raca_cor`, `escolaridade`: TEXT/DATE.
- `endereco_logradouro`, `endereco_numero`, `endereco_bairro`, `endereco_cidade`, `endereco_estado`, `endereco_cep`,
  `telefone`: TEXT.
- `endereco_complemento`, `email`: TEXT, opcionais.
- `grupos_risco`: TEXT[], mínimo 1 item.
- `consentimento_lgpd`: BOOLEAN, default TRUE.
- `created_at`: TIMESTAMP.

**Constraints**:

- `UNIQUE`: cpf, cns.
- `CHECK`: formatos válidos, mínimo de itens no array.

**Índices**:

- PK: `id`.
- Secundários: `idx_paciente_cpf`, `idx_paciente_cns`.

---

#### 3.1.3. unidade_saude

**Descrição**: Unidades cadastradas com seus serviços essenciais e localização.

**Colunas**:

- `id`: UUID, PK.
- `nome`, `tipo` (`HOSPITAL`, `UPA`, `UBS`), `cnes` (único), `endereco_*`, `telefone`: TEXT.
- `servicos_essenciais`: TEXT[], mínimo 1 item.
- `servicos_ampliados`: TEXT[], opcional.
- `created_at`: TIMESTAMP.

**Constraints**:

- `UNIQUE`: cnes.
- `CHECK`: tipo, formato do CNES, CEP, estado, telefone.

**Índices**:

- PK: `id`.
- Secundário: `idx_unidade_saude_cnes`.

---

#### 3.1.4. consulta

**Descrição**: Histórico de consultas médicas com vínculo a pacientes, profissionais e unidades.

**Colunas**:

- `id`: UUID, PK.
- `paciente_id`, `profissional_id`, `unidade_saude_id`: UUID, FKs.
- `observacoes`: TEXT.
- `cid10`: TEXT, opcional.
- `data_consulta`: TIMESTAMP.
- `created_at`: TIMESTAMP.

**Constraints**:

- `FK`: todas com `ON DELETE RESTRICT`.
- `CHECK`: formato CID10.
- `NOT NULL`: exceto `cid10`.

**Índices**:

- PK: `id`.
- Secundários: `idx_consulta_paciente_id`, `idx_consulta_profissional_id`, `idx_consulta_data_consulta`.

---

#### 3.1.5. prescricao

**Descrição**: Prescrições médicas com detalhes clínicos e CID-10.

**Colunas**:

- `id`: UUID, PK.
- `paciente_id`, `profissional_id`: UUID, FKs.
- `detalhes_prescricao`: TEXT.
- `cid10`: TEXT, opcional.
- `data_prescricao`, `created_at`: TIMESTAMP.

**Constraints**:

- `FK`: paciente_id, profissional_id com `ON DELETE RESTRICT`.
- `CHECK`: formato CID10.
- `NOT NULL`: exceto `cid10`.

**Índices**:

- PK: `id`.
- Secundários: `idx_prescricao_paciente_id`, `idx_prescricao_profissional_id`, `idx_prescricao_data_prescricao`.

---

#### 3.1.6. prontuario

**Descrição**: Prontuários médicos com controle de anonimização.

**Colunas**:

- `id`: UUID, PK.
- `paciente_id`, `profissional_id`: UUID, FKs.
- `descricao`: TEXT.
- `dados_anonimizados`: BOOLEAN, default FALSE.
- `created_at`: TIMESTAMP.

**Constraints**:

- `FK`: paciente_id, profissional_id com `ON DELETE RESTRICT`.

**Índices**:

- PK: `id`.
- Secundários: `idx_prontuario_paciente_id`, `idx_prontuario_profissional_id`.

---

#### 3.1.7. triagem

**Descrição**: Dados coletados em triagens por enfermeiros.

**Colunas**:

- `id`: UUID, PK.
- `paciente_id`, `enfermeiro_id`, `unidade_saude_id`: UUID, FKs.
- `sinais_vitais`: JSONB.
- `queixa_principal`: TEXT.
- `nivel_gravidade`: TEXT (`VERMELHO`, `LARANJA`, `AMARELO`, `VERDE`, `AZUL`).
- `data_triagem`, `created_at`: TIMESTAMP.

**Constraints**:

- `FK`: todas com `ON DELETE RESTRICT`.
- `CHECK`: valor permitido de `nivel_gravidade`.

**Índices**:

- PK: `id`.
- Secundários: `idx_triagem_paciente_id`, `idx_triagem_enfermeiro_id`, `idx_triagem_data_triagem`.

---

## 4. Segurança e Acesso

- **Autenticação**: Supabase Auth com JWT.
- **Criptografia**: Ativada em trânsito e repouso.
- **RLS**: Row-Level Security aplicado em todas as tabelas sensíveis.
- **Políticas**: Controle granular por função (admin, médico, enfermeiro).
- **Criptografia**: Senhas hasheadas com bcryptjs; dados criptografados pelo Supabase.
- **LGPD**: Coluna consentimento_lgpd em paciente registra consentimento.

---

## 5. Observações Finais

- **Normalização**: Todas as tabelas seguem 3FN.
- **Auditoria**: Os campos `created_at` servem como base de auditoria mínima.
- **Restrições**: Validações rigorosas garantem conformidade com normas da saúde pública brasileira.
- **Índices**: B-Tree em colunas de busca frequente (cpf, cns, email, data_consulta, etc.).
- **Transações**: Supabase gerencia em si transações em lote para operações em massa.
- **Escalabilidade**: Supabase suporta múltiplas unidades com isolamento por `unidade_saude_id`.
- **Manutenção**: Backups diários via Supabase e cron jobs para limpeza de dados obsoletos (ex.: `sessões expiradas`).

---

**Versão**: 0.1.0.
**Responsáveis**: João Victor Vieira de Araújo, Maria Yasmim Matos de Lima, Carlos Daniel Vieira do Nascimento, Douglas
Vinícios dos Santos Queiroz
**Revisado em**: 06/05/2025