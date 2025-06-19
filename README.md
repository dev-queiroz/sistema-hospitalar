# Documentação Oficial do Backend - Sistema Hospitalar

Esta documentação detalha todos os endpoints do backend do sistema hospitalar, hospedado em
`https://sistema-hospitalar.onrender.com`. Cada endpoint é descrito com sua funcionalidade, implementação, segurança,
granularidade, desempenho e otimizações. O sistema utiliza uma arquitetura RESTful, implementada com Node.js, Express e
banco de dados relacional (PostgreSQL via Supabase). A autenticação é gerenciada por JWT, e a segurança é reforçada por
validações, autorizações e conformidade com a LGPD. Esta documentação unifica as partes 1 e 2, cobrindo autenticação,
consultas, enfermeiros, médicos, pacientes, prescrições, prontuários, triagens e unidades de saúde.

---

## 1. Visão Geral do Sistema

O sistema hospitalar gerencia operações de saúde, incluindo autenticação de usuários (administradores, médicos,
enfermeiros), consultas, cadastro e gerenciamento de pacientes, prescrições médicas, prontuários, triagens e unidades de
saúde. Ele é projetado para atender a diferentes papéis (`ADMINISTRADOR`, `MEDICO`, `ENFERMEIRO`) com permissões
granulares, garantindo segurança, conformidade com a LGPD e desempenho otimizado para um sistema de saúde de médio
porte.

### Características Gerais

- **Arquitetura**: RESTful API com endpoints organizados por recurso (`/auth`, `/consultas`, `/enfermeiros`, `/medicos`,
  `/pacientes`, `/prescricoes`, `/prontuarios`, `/triagens`, `/unidades-saude`).
- **Autenticação**: JWT emitidos pelo Supabase, com validação de papéis (`ADMINISTRADOR`, `MEDICO`, `ENFERMEIRO`) e
  expiração configurável (ex.: 1 hora).
- **Segurança**: Validação de entrada, autorização por papel, criptografia de senhas (bcrypt) e dados sensíveis (CPF,
  CNS), anonimização em prontuários, e conformidade com LGPD.
- **Desempenho**: Otimizado com índices no banco, caching em consultas frequentes (Redis), respostas compactas e
  operações assíncronas (ex.: BullMQ para e-mails e logs).
- **Granularidade**: Endpoints específicos por ação e papel, com restrições por unidade de saúde para enfermeiros,
  garantindo acesso apenas ao necessário.
- **Hospedagem**: Render.com, com escalabilidade automática e baixa latência.
- **Escalabilidade**: Banco relacional preparado para milhares de usuários com índices adequados; autoescalamento via
  Render.com.
- **Conformidade LGPD**: Consentimento explícito para pacientes, dados anonimizados em prontuários, logs de auditoria
  para criação, atualização e exclusão, e armazenamento seguro de dados sensíveis.

---

## 2. Endpoints do Sistema

A seguir, cada endpoint é detalhado com sua descrição, funcionamento, segurança, granularidade, desempenho e
otimizações, organizado por recurso.

### 2.1 Autenticação (`/api/auth`)

#### POST /auth/register-admin

- **Descrição**: Registra um novo administrador no sistema.
- **Funcionamento**:
    - Recebe um payload JSON com dados pessoais (`nome`, `cpf`, `cns`, etc.), endereço, telefone, e-mail, senha e um
      `adminSecret` para validação.
    - Valida o `adminSecret` contra um valor configurado no servidor.
    - Criptografa a senha (bcrypt, 10 rounds) e armazena o usuário no banco com o papel `ADMINISTRADOR_PRINCIPAL`.
    - Retorna o ID do novo administrador.
- **Segurança**:
    - **Autenticação**: Não requer token, mas exige `adminSecret`.
    - **Autorização**: Restrito via `adminSecret`.
    - **Validação**: Campos obrigatórios validados (e-mail único, CPF/CNS válidos, formato de data, etc.).
    - **Criptografia**: HTTPS; senha hasheada com bcrypt; dados sensíveis (CPF, CNS) criptografados no banco.
    - **LGPD**: Dados sensíveis armazenados com segurança; endereço estruturado para auditoria; log de criação.
    - **Proteção**: Limite de tentativas por IP para evitar abuso (ex.: 5 tentativas em 15 minutos).
- **Granularidade**: Exclusivo para criação de administradores, com controle estrito via `adminSecret`.
- **Desempenho**:
    - **Latência**: ~200ms (validação, criptografia e escrita).
    - **Índices**: Índices únicos em `email`, `cpf`, `cns`.
- **Otimizações**:
    - Validação assíncrona de CPF/CNS.
    - Cache de configurações do `adminSecret` (Redis).
    - Transações para consistência.
- **Exemplo**:
  ```json
  {
    "email": "seu-email@gmail.com",
    "password": "senha",
    "nome": "Seu Nome",
    "adminSecret": "senhaAdmin",
    "cpf": "12345678901",
    "cns": "123456789012345",
    "dataNascimento": "1980-01-01",
    "sexo": "MASCULINO",
    "racaCor": "PARDA",
    "escolaridade": "SUPERIOR",
    "endereco": {
      "logradouro": "Rua Admin",
      "numero": "1",
      "bairro": "Centro",
      "cidade": "São Paulo",
      "estado": "SP",
      "cep": "12345000"
    },
    "telefone": "11999999999"
  }
  ```

#### POST /auth/login

- **Descrição**: Autentica um usuário (admin, médico, enfermeiro) e retorna um token JWT.
- **Funcionamento**:
    - Recebe `email` e `password` no payload.
    - Verifica se o e-mail existe e compara a senha com o hash armazenado (bcrypt).
    - Gera um token JWT com informações do usuário (`sub`, `role`, `email`) e expiração (ex.: 1 hora).
    - Retorna o token e metadados do usuário (ID, nome).
- **Segurança**:
    - **Autenticação**: Não requer token.
    - **Validação**: E-mail e senha obrigatórios; formato de e-mail validado.
    - **Criptografia**: HTTPS; senhas nunca armazenadas ou retornadas em texto puro.
    - **Proteção**: Limite de 5 tentativas por IP em 15 minutos para prevenir brute force.
- **Granularidade**: Universal, usado por todos os papéis, com token contendo o papel para autorização.
- **Desempenho**:
    - **Latência**: ~100ms (validação de credenciais e geração de token).
    - **Índices**: Índice em `email`.
- **Otimizações**:
    - Cache de tokens válidos (Redis).
    - Comparação de senhas assíncrona (bcrypt).
    - Resposta compacta.
- **Exemplo**:
  ```json
  {
    "email": "seu-email@gmail.com",
    "password": "senha"
  }
  ```

#### POST /auth/forgot-password

- **Descrição**: Inicia a recuperação de senha enviando um link de redefinição por e-mail.
- **Funcionamento**:
    - Recebe `email` do usuário.
    - Verifica se o e-mail está registrado.
    - Gera um token de redefinição (válido por 1 hora) e envia um e-mail com o link.
    - Retorna mensagem de sucesso (sem revelar se o e-mail existe).
- **Segurança**:
    - **Autenticação**: Não requer token.
    - **Validação**: E-mail validado quanto ao formato.
    - **Criptografia**: HTTPS; token de redefinição armazenado com hash.
    - **Proteção**: Limite de 3 solicitações por e-mail por hora; token descartado após uso.
- **Granularidade**: Endpoint único para recuperação de senha, independente do papel.
- **Desempenho**:
    - **Latência**: ~300ms (inclui envio de e-mail).
    - **Índices**: Índice em `email`.
- **Otimizações**:
    - Fila assíncrona para envio de e-mails (BullMQ).
    - Cache de tokens de redefinição (Redis, TTL de 1 hora).
- **Exemplo**:
  ```json
  {
    "email": "seu-email@exemplo.com"
  }
  ```

### 2.2 Consultas (`/api/consultas`)

#### POST /consultas

- **Descrição**: Cria uma nova consulta médica para um paciente.
- **Funcionamento**:
    - Requer token JWT com papel `MEDICO`.
    - Recebe `pacienteId`, `unidadeSaudeId`, `observacoes` e `cid10`.
    - Valida a existência do paciente e da unidade.
    - Associa a consulta ao médico autenticado e armazena no banco.
    - Retorna o ID da consulta criada.
- **Segurança**:
    - **Autenticação**: Token JWT (`MEDICO`).
    - **Autorização**: Apenas médicos podem criar consultas.
    - **Validação**: IDs validados; CID-10 verificado; observações limitadas a 1000 caracteres.
    - **Criptografia**: HTTPS.
    - **LGPD**: Observações sem dados sensíveis; log de criação.
- **Granularidade**: Específico para médicos, focado em consultas clínicas.
- **Desempenho**:
    - **Latência**: ~150ms (validações e escrita).
    - **Índices**: Índices em `pacienteId`, `unidadeSaudeId`, `medicoId`.
- **Otimizações**:
    - Cache de validação de CID-10 (Redis).
    - Transações otimizadas.
    - Validação assíncrona de IDs.
- **Exemplo**:
  ```json
  {
    "pacienteId": "{{paciente_id}}",
    "unidadeSaudeId": "{{unidade_saude_id}}",
    "observacoes": "Paciente com tosse persistente e febre baixa. Prescrito antibiótico.",
    "cid10": "J45"
  }
  ```

#### GET /consultas/{consulta_id}

- **Descrição**: Obtém detalhes de uma consulta específica.
- **Funcionamento**:
    - Requer token JWT com papel `MEDICO` ou `ENFERMEIRO`.
    - Busca a consulta pelo ID.
    - Retorna detalhes (paciente, médico, unidade, observações, CID-10).
- **Segurança**:
    - **Autenticação**: Token JWT (`MEDICO` ou `ENFERMEIRO`).
    - **Autorização**: Enfermeiros acessam apenas consultas de sua unidade.
    - **Validação**: ID validado; verificação de unidade para enfermeiros.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados sensíveis mascarados.
- **Granularidade**: Permite acesso por médicos e enfermeiros, com restrições por unidade.
- **Desempenho**:
    - **Latência**: ~100ms (busca por ID).
    - **Índices**: Índice primário em `id`.
- **Otimizações**:
    - Cache de consultas recentes (Redis, TTL de 5 minutos).
    - Joins otimizados.
    - Resposta compacta.
- **Exemplo**:
  ```
  GET /consultas/{{consulta_id}}
  ```

#### GET /consultas/pacientes/{paciente_id}

- **Descrição**: Lista todas as consultas de um paciente.
- **Funcionamento**:
    - Requer token JWT com papel `MEDICO` ou `ENFERMEIRO`.
    - Busca consultas associadas ao `pacienteId`.
    - Retorna uma lista com detalhes das consultas (data, médico, observações, etc.).
- **Segurança**:
    - **Autenticação**: Token JWT (`MEDICO` ou `ENFERMEIRO`).
    - **Autorização**: Enfermeiros veem apenas consultas de sua unidade.
    - **Validação**: `pacienteId` validado.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados sensíveis filtrados.
- **Granularidade**: Focado no histórico de consultas, com restrições por unidade.
- **Desempenho**:
    - **Latência**: ~200ms (depende do número de consultas).
    - **Índices**: Índice em `pacienteId`.
- **Otimizações**:
    - Paginação (20 por página).
    - Cache de resultados (Redis).
    - Filtros por data.
- **Exemplo**:
  ```
  GET /consultas/pacientes/{{paciente_id}}
  ```

#### PUT /consultas/{consulta_id}

- **Descrição**: Atualiza observações ou CID-10 de uma consulta.
- **Funcionamento**:
    - Requer token JWT com papel `MEDICO`.
    - Recebe `observacoes` e/ou `cid10`.
    - Valida CID-10 e atualiza a consulta, com log de alterações.
    - Retorna a consulta atualizada.
- **Segurança**:
    - **Autenticação**: Token JWT (`MEDICO`).
    - **Autorização**: Apenas o médico criador pode atualizar.
    - **Validação**: CID-10 validado; observações limitadas a 1000 caracteres.
    - **Criptografia**: HTTPS.
    - **LGPD**: Log de alterações; observações sem dados sensíveis.
- **Granularidade**: Atualização específica para médicos.
- **Desempenho**:
    - **Latência**: ~150ms (validação e atualização).
    - **Índices**: Índice primário em `id`.
- **Otimizações**:
    - Atualização parcial.
    - Log assíncrono (BullMQ).
    - Cache invalidado após atualização.
- **Exemplo**:
  ```json
  {
    "observacoes": "Paciente apresentou melhora após 5 dias de antibiótico. Mantida medicação.",
    "cid10": "J45.0"
  }
  ```

#### DELETE /consultas/{consulta_id}

- **Descrição**: Exclui uma consulta do sistema.
- **Funcionamento**:
    - Requer token JWT com papel `MEDICO`.
    - Marca a consulta como excluída (soft delete).
    - Retorna status de sucesso.
- **Segurança**:
    - **Autenticação**: Token JWT (`MEDICO`).
    - **Autorização**: Apenas o médico criador pode excluir.
    - **Validação**: ID validado.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados mantidos para auditoria.
- **Granularidade**: Exclusão restrita a médicos, com soft delete.
- **Desempenho**:
    - **Latência**: ~100ms (atualização simples).
    - **Índices**: Índice primário em `id`.
- **Otimizações**:
    - Soft delete para integridade.
    - Log assíncrono.
    - Cache invalidado após exclusão.
- **Exemplo**:
  ```
  DELETE /consultas/{{consulta_id}}
  ```

#### GET /consultas/profissional/{medico_id}

- **Descrição**: Lista consultas de um profissional específico.
- **Funcionamento**:
    - Requer token JWT com papel `ADMINISTRADOR`.
    - Busca consultas associadas ao `medicoId`.
    - Retorna uma lista de consultas (data, paciente, observações, etc.).
- **Segurança**:
    - **Autenticação**: Token JWT (`ADMINISTRADOR`).
    - **Autorização**: Exclusivo para administradores.
    - **Validação**: `medicoId` validado.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados sensíveis mascarados.
- **Granularidade**: Relatório administrativo por profissional.
- **Desempenho**:
    - **Latência**: ~200ms (depende do volume de consultas).
    - **Índices**: Índice em `medicoId`.
- **Otimizações**:
    - Paginação.
    - Cache de relatórios (Redis, TTL de 10 minutos).
    - Filtros por data.
- **Exemplo**:
  ```
  GET /consultas/profissional/{{medico_id}}
  ```

#### GET /consultas/unidade/{unidade_saude_id}/atendimentos-ativos

- **Descrição**: Lista atendimentos ativos em uma unidade de saúde.
- **Funcionamento**:
    - Requer token JWT com papel `ADMINISTRADOR`.
    - Busca consultas com status ativo na unidade especificada.
    - Retorna uma lista de atendimentos (paciente, médico, data, etc.).
- **Segurança**:
    - **Autenticação**: Token JWT (`ADMINISTRADOR`).
    - **Autorização**: Exclusivo para administradores.
    - **Validação**: `unidadeSaudeId` validado.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados sensíveis limitados.
- **Granularidade**: Relatório administrativo para monitoramento de unidades.
- **Desempenho**:
    - **Latência**: ~250ms (depende do número de atendimentos).
    - **Índices**: Índices em `unidadeSaudeId`, `status`.
- **Otimizações**:
    - Filtros otimizados para consultas ativas.
    - Cache de relatórios (Redis, TTL de 5 minutos).
    - Paginação.
- **Exemplo**:
  ```
  GET /consultas/unidade/{{unidade_saude_id}}/atendimentos-ativos
  ```

#### GET /consultas/unidade/{unidade_saude_id}

- **Descrição**: Lista todas as consultas de uma unidade de saúde.
- **Funcionamento**:
    - Requer token JWT com papel `ADMINISTRADOR`.
    - Busca todas as consultas associadas à `unidadeSaudeId`.
    - Retorna uma lista de consultas (paciente, médico, data, observações, etc.).
- **Segurança**:
    - **Autenticação**: Token JWT (`ADMINISTRADOR`).
    - **Autorização**: Exclusivo para administradores.
    - **Validação**: `unidadeSaudeId` validado.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados sensíveis mascarados.
- **Granularidade**: Relatório completo por unidade para administradores.
- **Desempenho**:
    - **Latência**: ~300ms (depende do volume de dados).
    - **Índices**: Índice em `unidadeSaudeId`.
- **Otimizações**:
    - Paginação e filtros por data.
    - Cache de resultados (Redis).
    - Joins otimizados.
- **Exemplo**:
  ```
  GET /consultas/unidade/{{unidade_saude_id}}
  ```

### 2.3 Enfermeiros (`/api/enfermeiros`)

#### POST /enfermeiros

- **Descrição**: Cria um novo enfermeiro no sistema.
- **Funcionamento**:
    - Requer token JWT com papel `ADMINISTRADOR`.
    - Recebe dados pessoais, profissionais (`coren`, `dataContratacao`) e `unidadeSaudeId`.
    - Valida unicidade de `email`, `cpf`, `cns`, `coren`.
    - Criptografa a senha (bcrypt) e armazena com papel `ENFERMEIRO`.
    - Retorna o ID do enfermeiro criado.
- **Segurança**:
    - **Autenticação**: Token JWT (`ADMINISTRADOR`).
    - **Autorização**: Exclusivo para administradores.
    - **Validação**: Campos obrigatórios; formatos validados; unicidade de `coren`.
    - **Criptografia**: HTTPS; senha hasheada com bcrypt.
    - **LGPD**: Dados sensíveis armazenados com segurança; log de criação.
- **Granularidade**: Específico para criação de enfermeiros, restrito a administradores.
- **Desempenho**:
    - **Latência**: ~200ms (validações, criptografia e escrita).
    - **Índices**: Índices únicos em `email`, `cpf`, `cns`, `coren`.
- **Otimizações**:
    - Validação assíncrona de `coren` (ex.: integração com conselho de enfermagem).
    - Cache de validações de unicidade (Redis).
    - Transações para consistência.
- **Exemplo**:
  ```json
  {
    "nome": "João Santos",
    "cpf": "09245682345",
    "cns": "937203894572163",
    "dataNascimento": "1990-08-20",
    "sexo": "MASCULINO",
    "racaCor": "PARDA",
    "escolaridade": "POS_GRADUACAO",
    "endereco": {
      "logradouro": "Avenida Paulista",
      "numero": "1500",
      "bairro": "Bela Vista",
      "cidade": "São Paulo",
      "estado": "SP",
      "cep": "01310000"
    },
    "telefone": "88996384623",
    "email": "seu-email@gmail.com",
    "senha": "senha",
    "dataContratacao": "2023-03-15",
    "coren": "974302-PB",
    "unidadeSaudeId": "{{unidadeId}}"
  }
  ```

#### GET /enfermeiros

- **Descrição**: Lista todos os enfermeiros ativos.
- **Funcionamento**:
    - Requer token JWT com papel `ADMINISTRADOR`.
    - Busca enfermeiros com status ativo.
    - Retorna uma lista com dados resumidos (nome, coren, unidade, etc.).
- **Segurança**:
    - **Autenticação**: Token JWT (`ADMINISTRADOR`).
    - **Autorização**: Exclusivo para administradores.
    - **Validação**: N/A.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados sensíveis mascarados.
- **Granularidade**: Visão geral para administradores.
- **Desempenho**:
    - **Latência**: ~200ms (depende do volume de enfermeiros).
    - **Índices**: Índice em `status`.
- **Otimizações**:
    - Paginação (50 por página).
    - Cache de resultados (Redis, TTL de 10 minutos).
    - Resposta compacta.
- **Exemplo**:
  ```
  GET /enfermeiros
  ```

#### GET /enfermeiros/{enfermeiro_id}

- **Descrição**: Obtém detalhes de um enfermeiro específico.
- **Funcionamento**:
    - Requer token JWT com papel `ADMINISTRADOR` ou `ENFERMEIRO`.
    - Busca o enfermeiro pelo ID.
    - Retorna dados completos (nome, coren, contato, unidade, etc.).
- **Segurança**:
    - **Autenticação**: Token JWT (`ADMINISTRADOR` ou `ENFERMEIRO`).
    - **Autorização**: Enfermeiro acessa apenas seus dados; administradores acessam qualquer enfermeiro.
    - **Validação**: `enfermeiro_id` validado.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados sensíveis mascarados.
- **Granularidade**: Alta, com acesso restrito ao próprio enfermeiro ou admin.
- **Desempenho**:
    - **Latência**: ~100ms (busca por ID).
    - **Índices**: Índice primário em `id`.
- **Otimizações**:
    - Cache de dados do usuário logado (Redis).
    - Resposta compacta.
    - Joins otimizados.
- **Exemplo**:
  ```
  GET /enfermeiros/{{enfermeiroId}}
  ```

#### PUT /enfermeiros/{enfermeiro_id}

- **Descrição**: Atualiza dados de um enfermeiro.
- **Funcionamento**:
    - Requer token JWT com papel `ADMINISTRADOR`.
    - Recebe campos atualizáveis (nome, coren, dataContratacao, etc.).
    - Valida unicidade de `coren` e atualiza no banco.
    - Retorna o enfermeiro atualizado.
- **Segurança**:
    - **Autenticação**: Token JWT (`ADMINISTRADOR`).
    - **Autorização**: Exclusivo para administradores.
    - **Validação**: Campos validados; log de alterações.
    - **Criptografia**: HTTPS.
    - **LGPD**: Auditoria de alterações armazenada.
- **Granularidade**: Atualização específica para administradores.
- **Desempenho**:
    - **Latência**: ~150ms (validação e atualização).
    - **Índices**: Índice primário em `id`; índice em `coren`.
- **Otimizações**:
    - Atualização parcial.
    - Log assíncrono (BullMQ).
    - Cache invalidado após atualização.
- **Exemplo**:
  ```json
  {
    "nome": "Maria Silva Atualizada",
    "coren": "654321-SP",
    "dataContratacao": "2023-02-01"
  }
  ```

#### DELETE /enfermeiros/{enfermeiro_id}

- **Descrição**: Exclui logicamente um enfermeiro.
- **Funcionamento**:
    - Requer token JWT com papel `ADMINISTRADOR`.
    - Marca o enfermeiro como inativo (soft delete).
    - Retorna status de sucesso.
- **Segurança**:
    - **Autenticação**: Token JWT (`ADMINISTRADOR`).
    - **Autorização**: Exclusivo para administradores.
    - **Validação**: `enfermeiro_id` validado.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados mantidos para auditoria; log de exclusão.
- **Granularidade**: Exclusão restrita a administradores, com soft delete.
- **Desempenho**:
    - **Latência**: ~100ms (atualização simples).
    - **Índices**: Índice primário em `id`.
- **Otimizações**:
    - Soft delete para integridade.
    - Log assíncrono.
    - Cache invalidado após exclusão.
- **Exemplo**:
  ```
  DELETE /enfermeiros/{{enfermeiro_id}}
  ```

### 2.4 Médicos (`/api/medicos`)

#### POST /medicos

- **Descrição**: Cria um novo médico no sistema.
- **Funcionamento**:
    - Requer token JWT com papel `ADMINISTRADOR`.
    - Recebe dados pessoais, profissionais (`crm`, `dataContratacao`) e `unidadeSaudeId`.
    - Valida unicidade de `email`, `cpf`, `cns`, `crm`.
    - Criptografa a senha (bcrypt) e armazena com papel `MEDICO`.
    - Retorna o ID do médico criado.
- **Segurança**:
    - **Autenticação**: Token JWT (`ADMINISTRADOR`).
    - **Autorização**: Exclusivo para administradores.
    - **Validação**: Campos obrigatórios; formatos validados; unicidade de `crm`.
    - **Criptografia**: HTTPS; senha hasheada com bcrypt.
    - **LGPD**: Dados sensíveis armazenados com segurança; log de criação.
- **Granularidade**: Específico para criação de médicos, restrito a administradores.
- **Desempenho**:
    - **Latência**: ~200ms (validações, criptografia e escrita).
    - **Índices**: Índices únicos em `email`, `cpf`, `cns`, `crm`.
- **Otimizações**:
    - Validação assíncrona de `crm` (ex.: integração com conselho de medicina).
    - Cache de validações de unicidade (Redis).
    - Transações para consistência.
- **Exemplo**:
  ```json
  {
    "nome": "Pedro Oliveira",
    "cpf": "98765432109",
    "cns": "987654321098765",
    "dataNascimento": "1980-03-15",
    "sexo": "MASCULINO",
    "racaCor": "BRANCA",
    "escolaridade": "SUPERIOR",
    "endereco": {
      "logradouro": "Avenida da Saúde",
      "numero": "450",
      "bairro": "Jardim América",
      "cidade": "São Paulo",
      "estado": "SP",
      "cep": "04532000"
    },
    "telefone": "11977776666",
    "email": "seu-email@gmail.com",
    "senha": "senha",
    "dataContratacao": "2023-03-15",
    "crm": "54321-SP",
    "unidadeSaudeId": "{{unidadeId}}"
  }
  ```

#### GET /medicos

- **Descrição**: Lista todos os médicos ativos.
- **Funcionamento**:
    - Requer token JWT com papel `ADMINISTRADOR` ou `MEDICO`.
    - Busca médicos com status ativo.
    - Retorna uma lista com dados resumidos (nome, crm, unidade, etc.).
- **Segurança**:
    - **Autenticação**: Token JWT (`ADMINISTRADOR` ou `MEDICO`).
    - **Autorização**: Médicos veem dados limitados; administradores têm acesso completo.
    - **Validação**: N/A.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados sensíveis mascarados para médicos.
- **Granularidade**: Visão geral para administradores e médicos, com restrições para médicos.
- **Desempenho**:
    - **Latência**: ~200ms (depende do volume de médicos).
    - **Índices**: Índice em `status`.
- **Otimizações**:
    - Paginação.
    - Cache de resultados (Redis, TTL de 10 minutos).
    - Resposta compacta.
- **Exemplo**:
  ```
  GET /medicos
  ```

#### GET /medicos/{medico_id}

- **Descrição**: Obtém detalhes de um médico específico.
- **Funcionamento**:
    - Requer token JWT com papel `ADMINISTRADOR` ou `MEDICO`.
    - Busca o médico pelo ID.
    - Retorna dados completos (nome, crm, contato, unidade, etc.).
- **Segurança**:
    - **Autenticação**: Token JWT (`ADMINISTRADOR` ou `MEDICO`).
    - **Autorização**: Médico acessa apenas seus dados; administradores acessam qualquer médico.
    - **Validação**: `medico_id` validado.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados sensíveis mascarados.
- **Granularidade**: Alta, com acesso restrito ao próprio médico ou admin.
- **Desempenho**:
    - **Latência**: ~100ms (busca por ID).
    - **Índices**: Índice primário em `id`.
- **Otimizações**:
    - Cache de dados do usuário logado (Redis).
    - Resposta compacta.
    - Joins otimizados.
- **Exemplo**:
  ```
  GET /medicos/{{medico_id}}
  ```

#### PUT /medicos/{medico_id}

- **Descrição**: Atualiza dados de um médico.
- **Funcionamento**:
    - Requer token JWT com papel `ADMINISTRADOR`.
    - Recebe campos atualizáveis (nome, crm, dataContratacao, etc.).
    - Valida unicidade de `crm` e atualiza no banco.
    - Retorna o médico atualizado.
- **Segurança**:
    - **Autenticação**: Token JWT (`ADMINISTRADOR`).
    - **Autorização**: Exclusivo para administradores.
    - **Validação**: Campos validados; log de alterações.
    - **Criptografia**: HTTPS.
    - **LGPD**: Auditoria de alterações armazenada.
- **Granularidade**: Atualização específica para administradores.
- **Desempenho**:
    - **Latência**: ~150ms (validação e atualização).
    - **Índices**: Índice primário em `id`; índice em `crm`.
- **Otimizações**:
    - Atualização parcial.
    - Log assíncrono (BullMQ).
    - Cache invalidado após atualização.
- **Exemplo**:
  ```json
  {
    "nome": "João Santos Atualizado",
    "crm": "54321-SP",
    "dataContratacao": "2023-02-01"
  }
  ```

#### DELETE /medicos/{medico_id}

- **Descrição**: Exclui logicamente um médico.
- **Funcionamento**:
    - Requer token JWT com papel `ADMINISTRADOR`.
    - Marca o médico como inativo (soft delete).
    - Retorna status de sucesso.
- **Segurança**:
    - **Autenticação**: Token JWT (`ADMINISTRADOR`).
    - **Autorização**: Exclusivo para administradores.
    - **Validação**: `medico_id` validado.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados mantidos para auditoria; log de exclusão.
- **Granularidade**: Exclusão restrita a administradores, com soft delete.
- **Desempenho**:
    - **Latência**: ~100ms (atualização simples).
    - **Índices**: Índice primário em `id`.
- **Otimizações**:
    - Soft delete para integridade.
    - Log assíncrono.
    - Cache invalidado após exclusão.
- **Exemplo**:
  ```
  DELETE /medicos/{{medico_id}}
  ```

### 2.5 Pacientes (`/api/pacientes`)

#### POST /pacientes

- **Descrição**: Cria um novo paciente no sistema.
- **Funcionamento**:
    - Requer token JWT com papel `ENFERMEIRO` ou `ADMINISTRADOR`.
    - Recebe dados pessoais (`nome`, `cpf`, `cns`, etc.), endereço, contato, `gruposRisco`, `consentimentoLGPD` e
      `unidadeSaudeId`.
    - Valida unicidade de `cpf`, `cns`, `email`; verifica `consentimentoLGPD` como verdadeiro.
    - Armazena o paciente com status ativo.
    - Retorna o ID do paciente criado.
- **Segurança**:
    - **Autenticação**: Token JWT (`ENFERMEIRO` ou `ADMINISTRADOR`).
    - **Autorização**: Enfermeiros criam pacientes apenas em sua unidade; administradores sem restrição.
    - **Validação**: Campos obrigatórios; formatos validados (CPF, CNS, e-mail); `gruposRisco` em lista predefinida.
    - **Criptografia**: HTTPS; dados sensíveis (CPF, CNS) criptografados.
    - **LGPD**: Consentimento explícito (`consentimentoLGPD`); log de criação.
- **Granularidade**: Específico para criação de pacientes, com restrições por unidade.
- **Desempenho**:
    - **Latência**: ~200ms (validações e escrita).
    - **Índices**: Índices únicos em `cpf`, `cns`, `email`.
- **Otimizações**:
    - Validação assíncrona de CPF/CNS.
    - Cache de validações de unicidade (Redis).
    - Transações para consistência.
- **Exemplo**:
  ```json
  {
    "nome": "João Silva",
    "cpf": "12345678901",
    "cns": "123456789012345",
    "dataNascimento": "1990-01-01",
    "sexo": "MASCULINO",
    "racaCor": "PARDA",
    "escolaridade": "MEDIO",
    "endereco": {
      "logradouro": "Rua Exemplo",
      "numero": "123",
      "bairro": "Centro",
      "cidade": "São Paulo",
      "estado": "SP",
      "cep": "12345678"
    },
    "telefone": "11987654321",
    "email": "joao.silva@exemplo.com",
    "gruposRisco": ["DIABETICO"],
    "consentimentoLGPD": true,
    "unidadeSaudeId": "{{unidade_saude_id}}"
  }
  ```

#### GET /pacientes

- **Descrição**: Lista todos os pacientes ativos.
- **Funcionamento**:
    - Requer token JWT com papel `ENFERMEIRO`, `MEDICO` ou `ADMINISTRADOR`.
    - Busca pacientes com status ativo.
    - Retorna uma lista com dados resumidos (nome, ID, unidade, etc.).
- **Segurança**:
    - **Autenticação**: Token JWT (`ENFERMEIRO`, `MEDICO`, `ADMINISTRADOR`).
    - **Autorização**: Enfermeiros veem pacientes de sua unidade; médicos e administradores sem restrição.
    - **Validação**: N/A.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados sensíveis (CPF, CNS) mascarados.
- **Granularidade**: Visão geral com restrições por unidade para enfermeiros.
- **Desempenho**:
    - **Latência**: ~200ms (depende do volume de pacientes).
    - **Índices**: Índice em `status`, `unidadeSaudeId`.
- **Otimizações**:
    - Paginação (50 por página).
    - Cache de resultados (Redis, TTL de 10 minutos).
    - Resposta compacta.
- **Exemplo**:
  ```
  GET /pacientes
  ```

#### GET /pacientes/{paciente_id}

- **Descrição**: Obtém detalhes de um paciente específico.
- **Funcionamento**:
    - Requer token JWT com papel `ENFERMEIRO`, `MEDICO` ou `ADMINISTRADOR`.
    - Busca o paciente pelo ID.
    - Retorna dados completos (nome, CPF, CNS, endereço, gruposRisco, etc.).
- **Segurança**:
    - **Autenticação**: Token JWT (`ENFERMEIRO`, `MEDICO`, `ADMINISTRADOR`).
    - **Autorização**: Enfermeiros acessam apenas pacientes de sua unidade.
    - **Validação**: `paciente_id` validado.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados sensíveis mascarados, se necessário.
- **Granularidade**: Alta, com restrições por unidade para enfermeiros.
- **Desempenho**:
    - **Latência**: ~100ms (busca por ID).
    - **Índices**: Índice primário em `id`.
- **Otimizações**:
    - Cache de dados de pacientes frequentes (Redis).
    - Resposta compacta.
    - Joins otimizados.
- **Exemplo**:
  ```
  GET /pacientes/{{paciente_id}}
  ```

#### PUT /pacientes/{paciente_id}

- **Descrição**: Atualiza dados de um paciente.
- **Funcionamento**:
    - Requer token JWT com papel `ENFERMEIRO` ou `ADMINISTRADOR`.
    - Recebe campos atualizáveis (nome, telefone, email, gruposRisco, etc.).
    - Valida unicidade de `email` (se alterado) e atualiza no banco.
    - Retorna o paciente atualizado.
- **Segurança**:
    - **Autenticação**: Token JWT (`ENFERMEIRO` ou `ADMINISTRADOR`).
    - **Autorização**: Enfermeiros atualizam apenas pacientes de sua unidade.
    - **Validação**: Campos validados; `gruposRisco` em lista predefinida; log de alterações.
    - **Criptografia**: HTTPS.
    - **LGPD**: Auditoria de alterações armazenada.
- **Granularidade**: Atualização específica com restrições por unidade.
- **Desempenho**:
    - **Latência**: ~150ms (validação e atualização).
    - **Índices**: Índice primário em `id`; índice em `email`.
- **Otimizações**:
    - Atualização parcial.
    - Log assíncrono (BullMQ).
    - Cache invalidado após atualização.
- **Exemplo**:
  ```json
  {
    "nome": "João Silva Atualizado",
    "telefone": "11912345678",
    "gruposRisco": ["DIABETICO", "HIPERTENSO"]
  }
  ```

#### DELETE /pacientes/{paciente_id}

- **Descrição**: Exclui logicamente um paciente.
- **Funcionamento**:
    - Requer token JWT com papel `ENFERMEIRO` ou `ADMINISTRADOR`.
    - Marca o paciente como inativo (soft delete).
    - Retorna status de sucesso.
- **Segurança**:
    - **Autenticação**: Token JWT (`ENFERMEIRO` ou `ADMINISTRADOR`).
    - **Autorização**: Enfermeiros excluem apenas pacientes de sua unidade.
    - **Validação**: `paciente_id` validado.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados mantidos para auditoria; log de exclusão.
- **Granularidade**: Exclusão restrita com soft delete.
- **Desempenho**:
    - **Latência**: ~100ms (atualização simples).
    - **Índices**: Índice primário em `id`.
- **Otimizações**:
    - Soft delete para integridade.
    - Log assíncrono.
    - Cache invalidado após exclusão.
- **Exemplo**:
  ```
  DELETE /pacientes/{{paciente_id}}
  ```

#### GET /pacientes/{paciente_id}/historico

- **Descrição**: Obtém o histórico clínico de um paciente.
- **Funcionamento**:
    - Requer token JWT com papel `ENFERMEIRO`, `MEDICO` ou `ADMINISTRADOR`.
    - Busca consultas, prescrições, prontuários e triagens associadas ao `pacienteId`.
    - Retorna uma lista cronológica de eventos (data, tipo, detalhes).
- **Segurança**:
    - **Autenticação**: Token JWT (`ENFERMEIRO`, `MEDICO`, `ADMINISTRADOR`).
    - **Autorização**: Enfermeiros acessam apenas dados de sua unidade.
    - **Validação**: `paciente_id` validado.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados sensíveis anonimizados ou mascarados.
- **Granularidade**: Histórico completo com restrições por unidade.
- **Desempenho**:
    - **Latência**: ~300ms (depende do volume de dados).
    - **Índices**: Índices em `pacienteId` nas tabelas relacionadas.
- **Otimizações**:
    - Paginação.
    - Cache de históricos recentes (Redis, TTL de 5 minutos).
    - Joins otimizados.
- **Exemplo**:
  ```
  GET /pacientes/{{paciente_id}}/historico
  ```

### 2.6 Prescrições (`/api/prescricoes`)

#### POST /prescricoes

- **Descrição**: Cria uma nova prescrição para um paciente.
- **Funcionamento**:
    - Requer token JWT com papel `MEDICO` ou `ENFERMEIRO` (em UPA).
    - Recebe `pacienteId`, `unidadeSaudeId`, `detalhesPrescricao` e `cid10`.
    - Valida a existência do paciente e da unidade; verifica se a unidade é UPA para enfermeiros.
    - Armazena a prescrição associada ao profissional autenticado.
    - Retorna o ID da prescrição criada.
- **Segurança**:
    - **Autenticação**: Token JWT (`MEDICO` ou `ENFERMEIRO`).
    - **Autorização**: Enfermeiros só criam em UPAs.
    - **Validação**: IDs validados; CID-10 verificado; `detalhesPrescricao` limitado a 1000 caracteres.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados sensíveis protegidos; log de criação.
- **Granularidade**: Específico para prescrições, com restrições por tipo de unidade.
- **Desempenho**:
    - **Latência**: ~150ms (validações e escrita).
    - **Índices**: Índices em `pacienteId`, `unidadeSaudeId`.
- **Otimizações**:
    - Cache de validação de CID-10 (Redis).
    - Transações otimizadas.
    - Validação assíncrona de IDs.
- **Exemplo**:
  ```json
  {
    "pacienteId": "{{paciente_id}}",
    "unidadeSaudeId": "{{unidade_saude_id}}",
    "detalhesPrescricao": "Amoxicilina 500mg, 1 cápsula a cada 8 horas por 7 dias.",
    "cid10": "J45"
  }
  ```

#### GET /prescricoes/{prescricao_id}

- **Descrição**: Obtém detalhes de uma prescrição específica.
- **Funcionamento**:
    - Requer token JWT com papel `MEDICO` ou `ENFERMEIRO`.
    - Busca a prescrição pelo ID.
    - Retorna detalhes (paciente, profissional, unidade, prescrição, CID-10).
- **Segurança**:
    - **Autenticação**: Token JWT (`MEDICO` ou `ENFERMEIRO`).
    - **Autorização**: Enfermeiros acessam apenas prescrições de sua unidade.
    - **Validação**: `prescricao_id` validado.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados sensíveis mascarados.
- **Granularidade**: Alta, com restrições por unidade para enfermeiros.
- **Desempenho**:
    - **Latência**: ~100ms (busca por ID).
    - **Índices**: Índice primário em `id`.
- **Otimizações**:
    - Cache de prescrições recentes (Redis, TTL de 5 minutos).
    - Joins otimizados.
- **Exemplo**:
  ```
  GET /prescricoes/{{prescricao_id}}
  ```

#### GET /prescricoes/pacientes/{paciente_id}

- **Descrição**: Lista prescrições de um paciente.
- **Funcionamento**:
    - Requer token JWT com papel `MEDICO` ou `ENFERMEIRO`.
    - Busca prescrições associadas ao `pacienteId`.
    - Retorna uma lista de prescrições (data, detalhes, CID-10, etc.).
- **Segurança**:
    - **Autenticação**: Token JWT (`MEDICO` ou `ENFERMEIRO`).
    - **Autorização**: Enfermeiros veem apenas prescrições de sua unidade.
    - **Validação**: `paciente_id` validado.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados sensíveis mascarados.
- **Granularidade**: Focado no histórico de prescrições.
- **Desempenho**:
    - **Latência**: ~200ms (depende do número de prescrições).
    - **Índices**: Índice em `pacienteId`.
- **Otimizações**:
    - Paginação (20 por página).
    - Cache de resultados (Redis).
    - Filtros por data.
- **Exemplo**:
  ```
  GET /prescricoes/pacientes/{{paciente_id}}
  ```

#### PUT /prescricoes/{prescricao_id}

- **Descrição**: Atualiza uma prescrição.
- **Funcionamento**:
    - Requer token JWT com papel `MEDICO` ou `ENFERMEIRO` (em UPA).
    - Recebe `detalhesPrescricao` e/ou `cid10`.
    - Valida CID-10 e atualiza a prescrição, com log de alterações.
    - Retorna a prescrição atualizada.
- **Segurança**:
    - **Autenticação**: Token JWT (`MEDICO` ou `ENFERMEIRO`).
    - **Autorização**: Apenas o criador pode atualizar; enfermeiros restritos a UPAs.
    - **Validação**: CID-10 validado; `detalhesPrescricao` limitado.
    - **Criptografia**: HTTPS.
    - **LGPD**: Log de alterações.
- **Granularidade**: Atualização específica com restrições.
- **Desempenho**:
    - **Latência**: ~150ms (validação e atualização).
    - **Índices**: Índice primário em `id`.
- **Otimizações**:
    - Atualização parcial.
    - Log assíncrono (BullMQ).
    - Cache invalidado após atualização.
- **Exemplo**:
  ```json
  {
    "detalhesPrescricao": "Amoxicilina 500mg, 1 cápsula a cada 8 horas por 10 dias.",
    "cid10": "J45.0"
  }
  ```

#### DELETE /prescricoes/{prescricao_id}

- **Descrição**: Exclui uma prescrição.
- **Funcionamento**:
    - Requer token JWT com papel `MEDICO`.
    - Marca a prescrição como excluída (soft delete).
    - Retorna status de sucesso.
- **Segurança**:
    - **Autenticação**: Token JWT (`MEDICO`).
    - **Autorização**: Apenas o médico criador pode excluir.
    - **Validação**: `prescricao_id` validado.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados mantidos para auditoria; log de exclusão.
- **Granularidade**: Exclusão restrita a médicos.
- **Desempenho**:
    - **Latência**: ~100ms (atualização simples).
    - **Índices**: Índice primário em `id`.
- **Otimizações**:
    - Soft delete para integridade.
    - Log assíncrono.
    - Cache invalidado após exclusão.
- **Exemplo**:
  ```
  DELETE /prescricoes/{{prescricao_id}}
  ```

#### GET /prescricoes/{prescricao_id}/pdf

- **Descrição**: Gera um PDF da prescrição.
- **Funcionamento**:
    - Requer token JWT com papel `MEDICO`, `ENFERMEIRO` ou `ADMINISTRADOR`.
    - Busca a prescrição pelo ID.
    - Gera um PDF com detalhes da prescrição (usando `pdfkit`).
    - Retorna o PDF como stream.
- **Segurança**:
    - **Autenticação**: Token JWT (`MEDICO`, `ENFERMEIRO`, `ADMINISTRADOR`).
    - **Autorização**: Enfermeiros acessam apenas prescrições de sua unidade.
    - **Validação**: `prescricao_id` validado.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados sensíveis anonimizados no PDF.
- **Granularidade**: Geração de documento com restrições por unidade.
- **Desempenho**:
    - **Latência**: ~500ms (geração de PDF é intensiva).
    - **Índices**: Índice primário em `id`.
- **Otimizações**:
    - Cache de PDFs gerados (Redis, TTL de 1 hora).
    - Geração assíncrona para grandes volumes.
    - Compressão do PDF.
- **Exemplo**:
  ```
  GET /prescricoes/{{prescricao_id}}/pdf
  ```

### 2.7 Prontuários (`/api/prontuarios`)

#### POST /prontuarios

- **Descrição**: Cria um novo prontuário para um paciente.
- **Funcionamento**:
    - Requer token JWT com papel `MEDICO` ou `ENFERMEIRO`.
    - Recebe `pacienteId`, `unidadeSaudeId`, `descricao` e `dadosAnonimizados`.
    - Valida a existência do paciente e da unidade.
    - Armazena o prontuário com dados anonimizados para LGPD.
    - Retorna o ID do prontuário criado.
- **Segurança**:
    - **Autenticação**: Token JWT (`MEDICO` ou `ENFERMEIRO`).
    - **Autorização**: Enfermeiros criam apenas em sua unidade.
    - **Validação**: IDs validados; `descricao` limitada a 2000 caracteres; `dadosAnonimizados` obrigatórios.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados anonimizados (nome, CPF mascarados); log de criação.
- **Granularidade**: Específico para prontuários, com anonimização.
- **Desempenho**:
    - **Latência**: ~150ms (validações e escrita).
    - **Índices**: Índices em `pacienteId`, `unidadeSaudeId`.
- **Otimizações**:
    - Cache de validações de IDs (Redis).
    - Transações otimizadas.
- **Exemplo**:
  ```json
  {
    "pacienteId": "{{paciente_id}}",
    "unidadeSaudeId": "{{unidade_saude_id}}",
    "descricao": "Paciente apresentou febre e tosse persistente. Realizado exame físico e solicitado raio-X de tórax.",
    "dadosAnonimizados": {
      "nome": "Paciente Anonimizado",
      "cpf": "XXX.XXX.XXX-XX"
    }
  }
  ```

#### GET /prontuarios/{prontuario_id}

- **Descrição**: Obtém detalhes de um prontuário específico.
- **Funcionamento**:
    - Requer token JWT com papel `MEDICO` ou `ENFERMEIRO`.
    - Busca o prontuário pelo ID.
    - Retorna detalhes (paciente, profissional, unidade, descrição, dados anonimizados).
- **Segurança**:
    - **Autenticação**: Token JWT (`MEDICO` ou `ENFERMEIRO`).
    - **Autorização**: Enfermeiros acessam apenas prontuários de sua unidade.
    - **Validação**: `prontuario_id` validado.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados anonimizados retornados.
- **Granularidade**: Alta, com restrições por unidade.
- **Desempenho**:
    - **Latência**: ~100ms (busca por ID).
    - **Índices**: Índice primário em `id`.
- **Otimizações**:
    - Cache de prontuários recentes (Redis, TTL de 5 minutos).
    - Joins otimizados.
- **Exemplo**:
  ```
  GET /prontuarios/{{prontuario_id}}
  ```

#### GET /prontuarios/pacientes/{paciente_id}

- **Descrição**: Lista prontuários de um paciente.
- **Funcionamento**:
    - Requer token JWT com papel `MEDICO` ou `ENFERMEIRO`.
    - Busca prontuários associados ao `pacienteId`.
    - Retorna uma lista de prontuários (data, descrição, etc.).
- **Segurança**:
    - **Autenticação**: Token JWT (`MEDICO` ou `ENFERMEIRO`).
    - **Autorização**: Enfermeiros veem apenas prontuários de sua unidade.
    - **Validação**: `paciente_id` validado.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados anonimizados retornados.
- **Granularidade**: Focado no histórico de prontuários.
- **Desempenho**:
    - **Latência**: ~200ms (depende do número de prontuários).
    - **Índices**: Índice em `pacienteId`.
- **Otimizações**:
    - Paginação (20 por página).
    - Cache de resultados (Redis).
    - Filtros por data.
- **Exemplo**:
  ```
  GET /prontuarios/pacientes/{{paciente_id}}
  ```

#### PUT /prontuarios/{prontuario_id}

- **Descrição**: Atualiza um prontuário.
- **Funcionamento**:
    - Requer token JWT com papel `MEDICO`.
    - Recebe `descricao` e/ou `dadosAnonimizados`.
    - Valida os campos e atualiza o prontuário, com log de alterações.
    - Retorna o prontuário atualizado.
- **Segurança**:
    - **Autenticação**: Token JWT (`MEDICO`).
    - **Autorização**: Apenas o médico criador pode atualizar.
    - **Validação**: `descricao` limitada; `dadosAnonimizados` obrigatórios.
    - **Criptografia**: HTTPS.
    - **LGPD**: Log de alterações; dados anonimizados mantidos.
- **Granularidade**: Atualização específica para médicos.
- **Desempenho**:
    - **Latência**: ~150ms (validação e atualização).
    - **Índices**: Índice primário em `id`.
- **Otimizações**:
    - Atualização parcial.
    - Log assíncrono (BullMQ).
    - Cache invalidado após atualização.
- **Exemplo**:
  ```json
  {
    "descricao": "Paciente retornou com melhora dos sintomas após medicação. Raio-X normal.",
    "dadosAnonimizados": {
      "nome": "Paciente Anonimizado Atualizado",
      "cpf": "XXX.XXX.XXX-XX"
    }
  }
  ```

#### DELETE /prontuarios/{prontuario_id}

- **Descrição**: Exclui um prontuário.
- **Funcionamento**:
    - Requer token JWT com papel `MEDICO`.
    - Marca o prontuário como excluído (soft delete).
    - Retorna status de sucesso.
- **Segurança**:
    - **Autenticação**: Token JWT (`MEDICO`).
    - **Autorização**: Apenas o médico criador pode excluir.
    - **Validação**: `prontuario_id` validado.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados mantidos para auditoria; log de exclusão.
- **Granularidade**: Exclusão restrita a médicos.
- **Desempenho**:
    - **Latência**: ~100ms (atualização simples).
    - **Índices**: Índice primário em `id`.
- **Otimizações**:
    - Soft delete para integridade.
    - Log assíncrono.
    - Cache invalidado após exclusão.
- **Exemplo**:
  ```
  DELETE /prontuarios/{{prontuario_id}}
  ```

#### GET /prontuarios/{prontuario_id}/pdf

- **Descrição**: Gera um PDF do prontuário.
- **Funcionamento**:
    - Requer token JWT com papel `MEDICO` ou `ENFERMEIRO`.
    - Busca o prontuário pelo ID.
    - Gera um PDF com detalhes do prontuário (usando `pdfkit`).
    - Retorna o PDF como stream.
- **Segurança**:
    - **Autenticação**: Token JWT (`MEDICO` ou `ENFERMEIRO`).
    - **Autorização**: Enfermeiros acessam apenas prontuários de sua unidade.
    - **Validação**: `prontuario_id` validado.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados anonimizados no PDF.
- **Granularidade**: Geração de documento com restrições.
- **Desempenho**:
    - **Latência**: ~500ms (geração de PDF).
    - **Índices**: Índice primário em `id`.
- **Otimizações**:
    - Cache de PDFs gerados (Redis, TTL de 1 hora).
    - Geração assíncrona.
    - Compressão do PDF.
- **Exemplo**:
  ```
  GET /prontuarios/{{prontuario_id}}/pdf
  ```

### 2.8 Triagens (`/api/triagens`)

#### POST /triagens

- **Descrição**: Cria uma nova triagem para um paciente.
- **Funcionamento**:
    - Requer token JWT com papel `ENFERMEIRO`.
    - Recebe `pacienteId`, `unidadeSaudeId`, `enfermeiroId`, `sinaisVitais` e `queixaPrincipal`.
    - Valida a existência do paciente, unidade e enfermeiro; verifica sinais vitais realistas.
    - Armazena a triagem com classificação de gravidade (ex.: Manchester, baseada em `cor`).
    - Retorna o ID da triagem criada.
- **Segurança**:
    - **Autenticação**: Token JWT (`ENFERMEIRO`).
    - **Autorização**: Exclusivo para enfermeiros da unidade.
    - **Validação**: IDs validados; sinais vitais em intervalos realistas; `queixaPrincipal` limitada a 500 caracteres.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados sensíveis protegidos; log de criação.
- **Granularidade**: Específico para triagens, com foco em enfermeiros.
- **Desempenho**:
    - **Latência**: ~150ms (validações e escrita).
    - **Índices**: Índices em `pacienteId`, `unidadeSaudeId`, `enfermeiroId`.
- **Otimizações**:
    - Cache de validações de IDs (Redis).
    - Transações otimizadas.
- **Exemplo**:
  ```json
  {
    "pacienteId": "{{paciente_id}}",
    "unidadeSaudeId": "{{unidade_saude_id}}",
    "enfermeiroId": "{{enfermeiro_id}}",
    "sinaisVitais": {
      "pressaoArterialSistolica": 120,
      "pressaoArterialDiastolica": 80,
      "frequenciaCardiaca": 75,
      "frequenciaRespiratoria": 16,
      "saturacaoOxigenio": 98,
      "temperatura": 36.5,
      "nivelDor": 2,
      "estadoConsciente": true
    },
    "queixaPrincipal": "Dor de cabeça leve"
  }
  ```

#### GET /triagens/{triagem_id}

- **Descrição**: Obtém detalhes de uma triagem específica.
- **Funcionamento**:
    - Requer token JWT com papel `ENFERMEIRO` ou `MEDICO`.
    - Busca a triagem pelo ID.
    - Retorna detalhes (paciente, enfermeiro, unidade, sinais vitais, gravidade).
- **Segurança**:
    - **Autenticação**: Token JWT (`ENFERMEIRO` ou `MEDICO`).
    - **Autorização**: Enfermeiros acessam apenas triagens de sua unidade.
    - **Validação**: `triagem_id` validado.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados sensíveis mascarados.
- **Granularidade**: Alta, com restrições por unidade.
- **Desempenho**:
    - **Latência**: ~100ms (busca por ID).
    - **Índices**: Índice primário em `id`.
- **Otimizações**:
    - Cache de triagens recentes (Redis, TTL de 5 minutos).
    - Joins otimizados.
- **Exemplo**:
  ```
  GET /triagens/{{triagem_id}}
  ```

#### GET /triagens/pacientes/{paciente_id}

- **Descrição**: Lista triagens de um paciente.
- **Funcionamento**:
    - Requer token JWT com papel `ENFERMEIRO` ou `MEDICO`.
    - Busca triagens associadas ao `pacienteId`.
    - Retorna uma lista de triagens (data, sinais vitais, gravidade, etc.).
- **Segurança**:
    - **Autenticação**: Token JWT (`ENFERMEIRO` ou `MEDICO`).
    - **Autorização**: Enfermeiros veem apenas triagens de sua unidade.
    - **Validação**: `paciente_id` validado.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados sensíveis mascarados.
- **Granularidade**: Focado no histórico de triagens.
- **Desempenho**:
    - **Latência**: ~200ms (depende do número de triagens).
    - **Índices**: Índice em `pacienteId`.
- **Otimizações**:
    - Paginação (20 por página).
    - Cache de resultados (Redis).
    - Filtros por data.
- **Exemplo**:
  ```
  GET /triagens/pacientes/{{paciente_id}}
  ```

#### GET /triagens/gravidade/{cor}/unidade/{unidade_saude_id}

- **Descrição**: Lista pacientes por nível de gravidade em uma unidade.
- **Funcionamento**:
    - Requer token JWT com papel `ENFERMEIRO` ou `MEDICO`.
    - Busca triagens com o nível de gravidade especificado (ex.: `Vermelho`, `Azul`).
    - Retorna uma lista de pacientes e suas triagens.
- **Segurança**:
    - **Autenticação**: Token JWT (`ENFERMEIRO` ou `MEDICO`).
    - **Autorização**: Acesso restrito à unidade do profissional.
    - **Validação**: `cor` e `unidade_saude_id` validados.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados sensíveis mascarados.
- **Granularidade**: Relatório por gravidade para priorização de atendimento.
- **Desempenho**:
    - **Latência**: ~250ms (depende do volume de triagens).
    - **Índices**: Índices em `unidadeSaudeId`, `gravidade`.
- **Otimizações**:
    - Filtros otimizados para gravidade.
    - Cache de relatórios por unidade (Redis, TTL de 5 minutos).
    - Paginação.
- **Exemplo**:
  ```
  GET /triagens/gravidade/Vermelho/unidade/{{unidade_saude_id}}
  ```

#### PUT /triagens/{triagem_id}

- **Descrição**: Atualiza uma triagem.
- **Funcionamento**:
    - Requer token JWT com papel `ENFERMEIRO`.
    - Recebe `sinaisVitais` e/ou `queixaPrincipal`.
    - Valida sinais vitais e atualiza a triagem, com log de alterações.
    - Retorna a triagem atualizada.
- **Segurança**:
    - **Autenticação**: Token JWT (`ENFERMEIRO`).
    - **Autorização**: Apenas o enfermeiro criador pode atualizar.
    - **Validação**: Sinais vitais realistas; `queixaPrincipal` limitada.
    - **Criptografia**: HTTPS.
    - **LGPD**: Log de alterações.
- **Granularidade**: Atualização específica para enfermeiros.
- **Desempenho**:
    - **Latência**: ~150ms (validação e atualização).
    - **Índices**: Índice primário em `id`.
- **Otimizações**:
    - Atualização parcial.
    - Log assíncrono (BullMQ).
    - Cache invalidado após atualização.
- **Exemplo**:
  ```json
  {
    "sinaisVitais": {
      "pressaoArterialSistolica": 130,
      "pressaoArterialDiastolica": 85,
      "frequenciaCardiaca": 80,
      "frequenciaRespiratoria": 18,
      "saturacaoOxigenio": 97,
      "temperatura": 36.7,
      "nivelDor": 4,
      "estadoConsciente": true
    },
    "queixaPrincipal": "Dor de cabeça moderada"
  }
  ```

#### DELETE /triagens/{triagem_id}

- **Descrição**: Exclui uma triagem.
- **Funcionamento**:
    - Requer token JWT com papel `ENFERMEIRO`.
    - Marca a triagem como excluída (soft delete).
    - Retorna status de sucesso.
- **Segurança**:
    - **Autenticação**: Token JWT (`ENFERMEIRO`).
    - **Autorização**: Apenas o enfermeiro criador pode excluir.
    - **Validação**: `triagem_id` validado.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados mantidos para auditoria; log de exclusão.
- **Granularidade**: Exclusão restrita a enfermeiros.
- **Desempenho**:
    - **Latência**: ~100ms (atualização simples).
    - **Índices**: Índice primário em `id`.
- **Otimizações**:
    - Soft delete para integridade.
    - Log assíncrono.
    - Cache invalidado após exclusão.
- **Exemplo**:
  ```
  DELETE /triagens/{{triagem_id}}
  ```

### 2.9 Unidades de Saúde (`/api/unidades-saude`)

#### POST /unidades-saude

- **Descrição**: Cria uma nova unidade de saúde.
- **Funcionamento**:
    - Requer token JWT com papel `ADMINISTRADOR`.
    - Recebe `nome`, `tipo`, `cnes`, endereço, telefone, `servicosEssenciais` e `servicosAmpliados`.
    - Valida unicidade de `cnes` e armazena a unidade com status ativo.
    - Retorna o ID da unidade criada.
- **Segurança**:
    - **Autenticação**: Token JWT (`ADMINISTRADOR`).
    - **Autorização**: Exclusivo para administradores.
    - **Validação**: Campos obrigatórios; `cnes` validado; `tipo` em lista predefinida (ex.: HOSPITAL, UPA).
    - **Criptografia**: HTTPS.
    - **LGPD**: Endereço estruturado para auditoria; log de criação.
- **Granularidade**: Específico para criação de unidades.
- **Desempenho**:
    - **Latência**: ~150ms (validações e escrita).
    - **Índices**: Índice único em `cnes`.
- **Otimizações**:
    - Validação assíncrona de `cnes` (ex.: integração com CNES, se disponível).
    - Cache de validações (Redis).
    - Transações para consistência.
- **Exemplo**:
  ```json
  {
    "nome": "Hospital Central",
    "tipo": "HOSPITAL",
    "cnes": "1234567",
    "endereco": {
      "logradouro": "Rua Principal",
      "numero": "100",
      "bairro": "Centro",
      "cidade": "São Paulo",
      "estado": "SP",
      "cep": "12345000"
    },
    "telefone": "11999999999",
    "servicosEssenciais": ["Atendimento de emergência", "Internação"],
    "servicosAmpliados": ["Cirurgia"]
  }
  ```

#### GET /unidades-saude

- **Descrição**: Lista todas as unidades de saúde ativas.
- **Funcionamento**:
    - Requer token JWT com papel `ADMINISTRADOR`.
    - Busca unidades com status ativo.
    - Retorna uma lista com dados resumidos (nome, tipo, cnes, etc.).
- **Segurança**:
    - **Autenticação**: Token JWT (`ADMINISTRADOR`).
    - **Autorização**: Exclusivo para administradores.
    - **Validação**: N/A.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados sensíveis limitados.
- **Granularidade**: Visão geral para administradores.
- **Desempenho**:
    - **Latência**: ~200ms (depende do volume de unidades).
    - **Índices**: Índice em `status`.
- **Otimizações**:
    - Paginação (ex.: 50 por página).
    - Cache de resultados (Redis, TTL de 10 minutos).
    - Resposta compacta.
- **Exemplo**:
  ```
  GET /unidades-saude
  ```

#### GET /unidades-saude/{unidade_saude_id}

- **Descrição**: Obtém detalhes de uma unidade de saúde.
- **Funcionamento**:
    - Requer token JWT com papel `ADMINISTRADOR`.
    - Busca a unidade pelo ID.
    - Retorna dados completos (nome, tipo, cnes, endereço, serviços, etc.).
- **Segurança**:
    - **Autenticação**: Token JWT (`ADMINISTRADOR`).
    - **Autorização**: Exclusivo para administradores.
    - **Validação**: `unidade_saude_id` validado.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados sensíveis limitados.
- **Granularidade**: Alta, exclusiva para administradores.
- **Desempenho**:
    - **Latência**: ~100ms (busca por ID).
    - **Índices**: Índice primário em `id`.
- **Otimizações**:
    - Cache de dados da unidade (Redis).
    - Resposta compacta.
- **Exemplo**:
  ```
  GET /unidades-saude/{{unidade_saude_id}}
  ```

#### GET /unidades-saude/{unidade_saude_id}/funcionarios

- **Descrição**: Lista funcionários de uma unidade de saúde.
- **Funcionamento**:
    - Requer token JWT com papel `ADMINISTRADOR`.
    - Busca médicos e enfermeiros associados à unidade.
    - Retorna uma lista de funcionários (nome, ID, papel, etc.).
- **Segurança**:
    - **Autenticação**: Token JWT (`ADMINISTRADOR`).
    - **Autorização**: Exclusivo para administradores.
    - **Validação**: `unidade_saude_id` validado.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados sensíveis (CPF, CNS) mascarados.
- **Granularidade**: Relatório por unidade para administradores.
- **Desempenho**:
    - **Latência**: ~250ms (depende do número de funcionários).
    - **Índices**: Índice em `unidadeSaudeId` nas tabelas de funcionários.
- **Otimizações**:
    - Paginação (ex.: 50 por página).
    - Cache de relatórios (Redis, TTL de 10 minutos).
    - Joins otimizados.
- **Exemplo**:
  ```
  GET /unidades-saude/{{unidade_saude_id}}/funcionarios
  ```

#### PUT /unidades-saude/{unidade_saude_id}

- **Descrição**: Atualiza dados de uma unidade de saúde.
- **Funcionamento**:
    - Requer token JWT com papel `ADMINISTRADOR`.
    - Recebe campos atualizáveis (nome, tipo, cnes, endereço, etc.).
    - Valida unicidade de `cnes` (se alterado) e atualiza no banco.
    - Retorna a unidade atualizada.
- **Segurança**:
    - **Autenticação**: Token JWT (`ADMINISTRADOR`).
    - **Autorização**: Exclusivo para administradores.
    - **Validação**: Campos validados; log de alterações.
    - **Criptografia**: HTTPS.
    - **LGPD**: Auditoria de alterações armazenada.
- **Granularidade**: Atualização específica para administradores.
- **Desempenho**:
    - **Latência**: ~150ms (validação e atualização).
    - **Índices**: Índice primário em `id`; índice em `cnes`.
- **Otimizações**:
    - Atualização parcial.
    - Log assíncrono (BullMQ).
    - Cache invalidado após atualização.
- **Exemplo**:
  ```json
  {
    "nome": "Hospital Central Atualizado",
    "tipo": "HOSPITAL",
    "cnes": "1234567",
    "endereco": {
      "logradouro": "Rua Principal Atualizada",
      "numero": "200",
      "bairro": "Centro Atualizado",
      "cidade": "São Paulo Atualizado",
      "estado": "SP",
      "cep": "12345001"
    },
    "telefone": "11999999998",
    "servicosEssenciais": ["Atendimento de emergência atualizado", "Internação atualizada"],
    "servicosAmpliados": ["Cirurgia atualizada"]
  }
  ```

#### DELETE /unidades-saude/{unidade_saude_id}

- **Descrição**: Exclui uma unidade de saúde.
- **Funcionamento**:
    - Requer token JWT com papel `ADMINISTRADOR`.
    - Marca a unidade como inativa (soft delete).
    - Retorna status de sucesso.
- **Segurança**:
    - **Autenticação**: Token JWT (`ADMINISTRADOR`).
    - **Autorização**: Exclusivo para administradores.
    - **Validação**: `unidade_saude_id` validado.
    - **Criptografia**: HTTPS.
    - **LGPD**: Dados mantidos para auditoria; log de exclusão.
- **Granularidade**: Exclusão restrita a administradores.
- **Desempenho**:
    - **Latência**: ~100ms (atualização simples).
    - **Índices**: Índice primário em `id`.
- **Otimizações**:
    - Soft delete para integridade.
    - Log assíncrono.
    - Cache invalidado após exclusão.
- **Exemplo**:
  ```
  DELETE /unidades-saude/{{unidade_saude_id}}
  ```

#### POST /unidades-saude/{unidade_saude_id}/funcionarios/{funcionario_id}

- **Descrição**: Associa um funcionário a uma unidade de saúde.
- **Funcionamento**:
    - Requer token JWT com papel `ADMINISTRADOR`.
    - Valida a existência da unidade e do funcionário (médico ou enfermeiro).
    - Cria uma associação na tabela de relacionamento.
    - Retorna status de sucesso.
- **Segurança**:
    - **Autenticação**: Token JWT (`ADMINISTRADOR`).
    - **Autorização**: Exclusivo para administradores.
    - **Validação**: `unidade_saude_id` e `funcionario_id` validados.
    - **Criptografia**: HTTPS.
    - **LGPD**: Associação não expõe dados sensíveis; log de criação.
- **Granularidade**: Específico para gerenciamento de equipes.
- **Desempenho**:
    - **Latência**: ~100ms (validações e escrita).
    - **Índices**: Índices em `unidadeSaudeId` e `funcionarioId`.
- **Otimizações**:
    - Cache de validações de IDs (Redis).
    - Transações otimizadas.
- **Exemplo**:
  ```
  POST /unidades-saude/{{unidade_saude_id}}/funcionarios/{{funcionario_id}}
  ```

---

## 3. Considerações Técnicas Gerais

### Segurança

- **Autenticação e Autorização**: JWT com validação de papéis e expiração curta (1 hora). Refresh tokens recomendados
  para sessões longas.
- **Criptografia**: HTTPS em todas as requisições; dados sensíveis (CPF, CNS) criptografados no banco; PDFs gerados com
  dados anonimizados.
- **LGPD**: Consentimento explícito para pacientes; dados anonimizados em prontuários; logs de auditoria para
  alterações, exclusões e criações.
- **Proteção contra ataques**:
    - **SQL Injection**: Queries parametrizadas via Supabase.
    - **XSS/CSRF**: Validação e sanitização de entrada.
    - **Brute Force**: Rate limiting por IP (ex.: 5 tentativas em 15 minutos para APIs críticas).
    - **DDoS**: Proteção via Render.com e Cloudflare (se configurado).

### Granularidade

- Endpoints divididos por recurso e papel, garantindo acesso restrito ao necessário.
- Exemplo: Enfermeiros operam apenas em sua unidade; médicos gerenciam prescrições e prontuários; administradores têm
  controle total.
- Soft delete em todos os recursos para auditoria e conformidade.

### Desempenho

- **Latência média**: 100-300ms para operações simples; ~500ms para geração de PDFs.
- **Índices**: Tabelas com índices em campos-chave (`id`, `pacienteId`, `unidadeSaudeId`, `cnes`, etc.).
- **Escalabilidade**: Render.com suporta autoescalamento; banco relacional preparado para milhares de usuários com
  índices adequados.
- **Caching**: Redis recomendado para consultas frequentes (pacientes, prescrições, triagens) e validações (CID-10,
  CNES).

### Otimizações

- **Assincronia**: Operações pesadas (envio de e-mails, geração de PDFs, logs) em filas assíncronas (ex.: BullMQ).
- **Paginação**: Implementada em endpoints de listagem para reduzir carga.
- **Compressão**: Respostas compactadas com Gzip; PDFs comprimidos.
- **Transações**: Uso de transações no banco para consistência (ex.: criação de pacientes, associações).
- **Validações**: Cache de validações de unicidade, CID-10 e sinais vitais.

### Monitoramento e Manutenção

- **Logs**: Requisições logadas (ex.: Winston) para rastreamento e auditoria.
- **Monitoramento**: Integração recomendada com New Relic ou Datadog.
- **Backups**: Backups diários via Supabase ou Render.
- **Atualizações**: Node.js e dependências atualizados regularmente.

---

## 4. Conclusão Backend

O backend sistema hospitalar é uma solução robusta, segura e escalável para gerenciamento de clínicas, pacientes e
unidades de saúde. Com uma arquitetura RESTful, autenticação segura, granularidade por papel, desempenho otimizado e
conformidade com LGPD, ele atende às necessidades de um sistema de saúde de médio porte. As otimizações (cache, índices,
processamento assíncrono, etc.) garantem baixa latência e escalabilidade, enquanto a segurança robusta com validações,
criptografia e auditoria. A documentação cobre todos os endpoints, detalhadamente, com exemplos práticos, e está pronta
para guiar o desenvolvimento, integração ou auditoria do sistema.

---

Base URL: https://sistema-hospitalar.onrender.com/

Versão da Documentação: 3.0.0, 19 de Junho de 2024.