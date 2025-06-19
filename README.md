# Sistema Hospitalar - Backend

Bem-vindo ao repositório do backend do **Sistema Hospitalar**, uma API RESTful projetada para gerenciar operações de clínicas e unidades de saúde. Este sistema suporta autenticação de usuários, cadastro de pacientes, consultas médicas, prescrições, prontuários, triagens e gerenciamento de unidades de saúde, com foco em segurança, conformidade com LGPD e desempenho otimizado.

## Funcionalidades Principais

- **Autenticação e Autorização**: Suporte a administradores, médicos e enfermeiros com papéis granulares via JWT.
- **Gestão de Pacientes**: Cadastro, atualização, exclusão lógica e histórico clínico.
- **Consultas Médicas**: Criação, edição e listagem de consultas por paciente, médico ou unidade.
- **Prescrições e Prontuários**: Registro, edição e geração de PDFs com dados anonimizados.
- **Triagens**: Avaliação inicial por enfermeiros com classificação de gravidade.
- **Unidades de Saúde**: Gerenciamento de unidades (hospitais, UPAs) com serviços essenciais e ampliados.
- **Segurança**: Criptografia de dados sensíveis, validação de entrada, conformidade com LGPD e logs de auditoria.
- **Desempenho**: Cache (Redis), índices otimizados, processamento assíncrono (BullMQ) e respostas compactas.

## Tecnologias Utilizadas

- **Backend**: Node.js com Express.js
- **Banco de Dados**: PostgreSQL (via Supabase)
- **Autenticação**: Supabase Auth com JWT
- **Cache**: Redis
- **Fila**: BullMQ para tarefas assíncronas
- **Geração de PDF**: pdfkit
- **Segurança**: express-rate-limit, helmet, express-validator, bcrypt
- **Hospedagem**: Render.com
- **Monitoramento**: Winston

## Pré-requisitos

- Node.js (v18 ou superior)
- PostgreSQL (via Supabase ou local)
- Redis
- Conta no Render.com (para deploy)

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

  - Copie `.env.example` para `.env` e preencha com suas credenciais:

    ```env
    SUPABASE_URL=sua-url-supabase
    SUPABASE_KEY=sua-chave-supabase
    JWT_SECRET=sua-chave-jwt
    ADMIN_SECRET=seu-admin-secret
    ```

5. **Iniciar o servidor**:

  - Build:
    ```bash
    npm run build
    ```
  - Modo desenvolvimento:

    ```bash
    npm run dev
    ```
  - Modo produção:

    ```bash
    npm start
    ```

6. **Acessar a API**:

  - Base URL: `http://localhost:3000`
  - Exemplo: `POST /api/auth/login` para autenticação

## Documentação da API

A documentação completa da API está disponível em Documentação Oficial do Backend - Sistema Hospitalar.md. Ela detalha todos os endpoints, incluindo:

- Autenticação (`/auth`)
- Consultas (`/consultas`)
- Enfermeiros (`/enfermeiros`)
- Médicos (`/medicos`)
- Pacientes (`/pacientes`)
- Prescrições (`/prescricoes`)
- Prontuários (`/prontuarios`)
- Triagens (`/triagens`)
- Unidades de Saúde (`/unidades-saude`)

Cada endpoint inclui descrição, funcionamento, segurança, desempenho e exemplos de uso.

## Deploy

O sistema está hospedado no Render.com com autoescalamento. Para deploy próprio:

1. Crie um serviço no Render.com.
2. Conecte ao repositório Git.
3. Configure as variáveis de ambiente no painel do Render.
4. Inicie o deploy.

## Conformidade com LGPD

O sistema segue as diretrizes da LGPD, com:

- Consentimento explícito para pacientes.
- Anonimização de dados em prontuários.
- Logs de auditoria para criação, edição e exclusão.
- Criptografia de dados sensíveis (CPF, CNS).
- Soft delete para retenção de dados.

## Limitações

- Geração de PDFs pode ser lenta em grandes volumes (mitigada com cache).
- Validações externas (ex.: CNES, CRM) dependem de APIs de terceiros.
- Escalabilidade testada para centenas de usuários; para milhões, exige ajustes (ex.: sharding).

## Contribuição

Contribuições são bem-vindas! Siga estes passos:

1. Fork o repositório.
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`).
3. Commit suas alterações (`git commit -m "Adiciona nova funcionalidade"`).
4. Push para a branch (`git push origin feature/nova-funcionalidade`).
5. Abra um Pull Request.

## Contato

Para dúvidas ou suporte, entre em contato via:

- **E-mail**: dev.queiroz05@gmail.com
- **Issues**: Abra uma issue no repositório

## Licença

Este projeto está licenciado sob a Apache License 2.0.

---

**Versão**: 3.0.0\
**Data**: Junho de 2025\
**Base URL**: https://sistema-hospitalar.onrender.com/
