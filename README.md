# Sistema Hospitalar - Backend

Bem-vindo ao repositório do backend do **Sistema Hospitalar**, uma API RESTful completa projetada para gerenciar operações em clínicas, hospitais e unidades de saúde. O sistema suporta autenticação segura, gerenciamento de pacientes, profissionais, consultas, prescrições, prontuários, triagens, unidades de saúde e uma camada avançada de **Inteligência Artificial** para suporte à decisão clínica e epidemiológica.

## Funcionalidades Principais

* **Autenticação e Autorização**: JWT com papéis granulares (`ADMINISTRADOR_PRINCIPAL`, `MEDICO`, `ENFERMEIRO`).
* **Gestão de Pacientes**: Cadastro, atualização, exclusão lógica (soft delete), histórico clínico e consentimento LGPD explícito.
* **Consultas Médicas**: Criação, edição, listagem por paciente, médico ou unidade, com suporte a CID-10.
* **Prescrições e Prontuários**: Registro, edição, geração de PDFs e anonimização automática de dados sensíveis.
* **Triagens**: Avaliação inicial por enfermeiros com sinais vitais, classificação de gravidade e priorização.
* **Unidades de Saúde**: Cadastro e gerenciamento de hospitais/UPAs com CNES, serviços essenciais e ampliados.
* **Inteligência Artificial**:

    * Relatórios epidemiológicos de risco de surtos (ex.: doenças respiratórias sazonais).
    * Análise de pacientes recorrentes com sugestões de manejo.
    * Análise operacional de triagens por unidade (sobrecarga e recomendações).
    * Histórico de relatórios gerados com armazenamento seguro.
* **Segurança**: Criptografia de dados sensíveis, rate limiting, validação rigorosa, conformidade total com LGPD e logs de auditoria.
* **Desempenho**: Cache (Redis), índices otimizados, processamento assíncrono (BullMQ), paginação e respostas compactas.

## Tecnologias Utilizadas

* **Backend**: Node.js + Express.js
* **Banco de Dados**: PostgreSQL (via Supabase)
* **Autenticação**: Supabase Auth + JWT
* **Cache**: Redis
* **Fila Assíncrona**: BullMQ
* **Geração de PDF**: pdfkit
* **Inteligência Artificial**: Groq SDK (modelo Compound)
* **Segurança**: express-rate-limit, helmet, express-validator, bcrypt
* **Hospedagem**: Render.com (autoescalamento)
* **Logging**: Winston

## Pré-requisitos

* Node.js v18 ou superior
* Conta no Supabase (projeto PostgreSQL)
* Redis (local ou cloud)
* Chave API do Groq (para funcionalidades de IA)
* Conta no Render.com (para deploy)

## Configuração e Execução

1. **Clonar o repositório**:

   ```bash
   git clone https://github.com/seu-usuario/sistema-hospitalar.git
   cd sistema-hospitalar
   ```

2. **Instalar dependências**:

   ```bash
   npm install
   ```

3. **Configurar variáveis de ambiente**:

   Crie um arquivo `.env` baseado no `.env.example`:

   ```env
   SUPABASE_URL=sua-url-supabase
   SUPABASE_KEY=sua-chave-supabase
   JWT_SECRET=sua-chave-secreta-jwt
   ADMIN_SECRET=seu-secret-para-criar-admin
   GROQ_API_KEY=sua-chave-groq
   REDIS_URL=sua-url-redis
   ```

4. **Build e execução**:

    * Desenvolvimento:

      ```bash
      npm run dev
      ```
    * Produção:

      ```bash
      npm run build
      npm start
      ```

5. **Acessar a API**:

    * Local: `http://localhost:3000`
    * Produção: `https://sistema-hospitalar.onrender.com`

## Documentação da API

Todos os endpoints estão organizados por recurso. Base URL: `/api`

### Autenticação (`/auth`)

* `POST /auth/register-admin` – Cria administrador principal (exige `adminSecret`)
* `POST /auth/login` – Autenticação e emissão de JWT
* `POST /auth/forgot-password` – Inicia recuperação de senha

### Consultas (`/consultas`)

* `POST /consultas` – Cria consulta (médicos)
* `GET /consultas/:id`
* `GET /consultas/pacientes/:pacienteId`
* `GET /consultas/profissional/:medicoId`
* `GET /consultas/unidade/:unidadeId/*`
* `PUT /consultas/:id`
* `DELETE /consultas/:id`

### Enfermeiros e Médicos (`/enfermeiros`, `/medicos`)

* `POST`, `GET` (lista e individual), `PUT`, `DELETE` (soft delete) – Restritos a administradores

### Pacientes (`/pacientes`)

* `POST /pacientes` (enfermeiros/admin)
* `GET /pacientes`
* `PUT /pacientes/:id`
* `DELETE /pacientes/:id`
* `GET /pacientes/:id/historico`

### Prescrições (`/prescricoes`)

* `POST`, `GET`, `PUT`, `DELETE`
* `GET /prescricoes/:id/pdf` – Geração de PDF

### Prontuários (`/prontuarios`)

* `POST`, `GET`, `PUT`, `DELETE`
* `GET /prontuarios/:id/pdf`

### Triagens (`/triagens`)

* `POST` (enfermeiros)
* `GET`, `PUT`, `DELETE`
* `GET /triagens/gravidade/:cor/unidade/:unidadeId`

### Unidades de Saúde (`/unidades-saude`)

* `POST`, `GET`, `PUT`, `DELETE`
* `GET /unidades-saude/:id/funcionarios`

### Inteligência Artificial (`/ia`)

* `GET /ia/surto` – Relatório de risco de surto respiratório (admin/médico, opcional `?unidade_saude_id=`)
* `GET /ia/paciente/:pacienteId/recorrente` – Análise de recorrência (apenas médicos)
* `GET /ia/triagens/:unidadeSaudeId` – Análise operacional de triagens (admin/médico)
* `GET /ia/relatorios` – Lista últimos relatórios gerados (todos os profissionais, opcional `?limit=`)

Todos os relatórios de IA utilizam dados agregados e anonimizados, são salvos na tabela `relatorios_ia` e gerados com o modelo **Groq Compound**.

## Conformidade com LGPD

* Consentimento explícito obrigatório no cadastro de pacientes
* Anonimização automática em prontuários e PDFs
* Logs de auditoria completos
* Criptografia de dados sensíveis (CPF, CNS)
* Soft delete com retenção para auditoria
* Dados enviados à IA nunca contêm identificadores

## Deploy

O sistema está hospedado no Render.com com autoescalamento automático. Para deploy próprio:

1. Crie um Web Service no Render
2. Conecte ao repositório GitHub
3. Configure todas as variáveis de ambiente
4. Ative o auto-deploy

## Limitações e Observações

* Geração de PDFs pode ser intensiva (mitigada com cache)
* Funcionalidades de IA dependem de chave válida do Groq
* Escalabilidade testada para milhares de usuários simultâneos
* Integrações externas (ex.: validação de CRM/CNES) podem ser adicionadas futuramente

## Contribuição

Contribuições são super bem-vindas!

1. Fork o repositório
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças
4. Push e abra um Pull Request

## Contato

* **E-mail**: [queirozdouglas466@gmail.com](mailto:queirozdouglas466@gmail.com)
* **Issues**: Abra uma issue no repositório

## Licença

Apache License 2.0

---

**Versão**: 3.1.0  
**Data**: 19 de Dezembro de 2025  
