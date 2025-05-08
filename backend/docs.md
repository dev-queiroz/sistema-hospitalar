Documentação do Banco de Dados - Sistema Hospitalar
1. Introdução
   Esta documentação descreve o banco de dados do sistema hospitalar, projetado para gerenciar unidades de saúde, pacientes, funcionários (médicos, enfermeiros, administradores), consultas, prescrições, prontuários, e triagens. O banco de dados é essencial para suportar operações críticas em um ambiente hospitalar, garantindo integridade, segurança, e desempenho.
2. Plataforma
   O banco de dados é hospedado no Supabase, uma plataforma de banco de dados relacional baseada em PostgreSQL, oferecendo:

Escalabilidade: Suporta crescimento de dados em ambientes hospitalares.
Segurança: Autenticação integrada, criptografia em trânsito e em repouso.
Gerenciamento Simplificado: Interface web para administração de tabelas, índices, e consultas SQL.
Alta Disponibilidade: Replicação e backups automáticos.

O Supabase foi escolhido por sua compatibilidade com PostgreSQL, suporte nativo a autenticação (usada para login de funcionários), e facilidade de integração com APIs modernas.
3. Tecnologias Utilizadas

SGBD: PostgreSQL 15 (base do Supabase).
Extensões:
uuid-ossp: Para geração de IDs UUID.


Tipos de Dados Avançados:
JSONB: Usado para armazenar sinais vitais em triagens, permitindo flexibilidade na estrutura.
TEXT[]: Arrays para grupos de risco e serviços essenciais/ampliados.


Constraints:
CHECK: Validações para campos como CPF, CNS, sexo, e nível de gravidade.
FOREIGN KEY: Relacionamentos entre tabelas (ex.: paciente e consulta).
UNIQUE: Garante unicidade de CPF, CNS, CNES, e email.


Índices:
Índices B-tree para colunas frequentemente consultadas (ex.: CPF, email).


Ferramentas:
Supabase Dashboard: Para criação e gerenciamento de tabelas.
SQL Editor: Para execução de scripts de inicialização e manutenção.



4. Estrutura do Banco de Dados
   O banco de dados é composto por 7 tabelas, projetadas para suportar as funcionalidades do sistema hospitalar. Cada tabela inclui constraints, índices, e relacionamentos para garantir integridade e desempenho.
   4.1. Tabelas
   4.1.1. funcionario
   Armazena dados de médicos, enfermeiros, e administradores.

Colunas:
id (UUID, PK): Identificador único.
email (TEXT, UNIQUE): Email para login.
password (TEXT): Senha hasheada (bcryptjs).
papel (TEXT, CHECK): 'MEDICO', 'ENFERMEIRO', 'ADMINISTRADOR_PRINCIPAL'.
nome (TEXT): Nome completo.
cpf (TEXT, CHECK: 11 dígitos): CPF único.
cns (TEXT, CHECK: 15 dígitos): Cartão Nacional de Saúde.
data_nascimento (DATE): Data de nascimento.
sexo (TEXT, CHECK): 'MASCULINO', 'FEMININO', 'OUTRO'.
raca_cor (TEXT, CHECK): 'BRANCA', 'PRETA', 'PARDA', 'AMARELA', 'INDIGENA', 'NAO_DECLARADO'.
escolaridade (TEXT, CHECK): 'SEM_ESCOLARIDADE', 'FUNDAMENTAL', 'MEDIO', 'SUPERIOR', 'POS_GRADUACAO'.
crm (TEXT): Registro médico (apenas para médicos).
coren (TEXT): Registro de enfermagem (apenas para enfermeiros).
data_contratacao (DATE): Data de contratação.
endereco_* (TEXT): Logradouro, número, bairro, cidade, estado (2 caracteres), CEP (8 dígitos).
telefone (TEXT, CHECK: ≥10 dígitos): Telefone de contato.
created_at (TIMESTAMP): Data de criação.


Índices:
idx_funcionario_email: Para buscas por email.


Uso: Suporta autenticação e gerenciamento de funcionários.

4.1.2. paciente
Armazena dados de pacientes.

Colunas:
id (UUID, PK): Identificador único.
nome (TEXT): Nome completo.
cpf (TEXT, UNIQUE, CHECK: 11 dígitos): CPF único.
cns (TEXT, UNIQUE, CHECK: 15 dígitos): Cartão Nacional de Saúde.
data_nascimento (DATE): Data de nascimento.
sexo (TEXT, CHECK): 'MASCULINO', 'FEMININO', 'OUTRO'.
raca_cor (TEXT, CHECK): 'BRANCA', 'PRETA', 'PARDA', 'AMARELA', 'INDIGENA', 'NAO_DECLARADO'.
escolaridade (TEXT, CHECK): 'SEM_ESCOLARIDADE', 'FUNDAMENTAL', 'MEDIO', 'SUPERIOR', 'POS_GRADUACAO'.
endereco_* (TEXT): Logradouro, número, bairro, cidade, estado (2 caracteres), CEP (8 dígitos).
telefone (TEXT, CHECK: ≥10 dígitos): Telefone de contato.
email (TEXT, CHECK: formato de email): Email opcional.
grupos_risco (TEXT[]): Grupos de risco (ex.: ['Hipertenso', 'Diabético']).
consentimento_lgpd (BOOLEAN): Consentimento para uso de dados.
created_at (TIMESTAMP): Data de criação.


Índices:
idx_paciente_cpf: Para buscas por CPF.
idx_paciente_cns: Para buscas por CNS.


Uso: Gerencia informações de pacientes.

4.1.3. unidade_saude
Armazena dados de unidades de saúde (UBS, UPA, Hospital).

Colunas:
id (UUID, PK): Identificador único.
nome (TEXT): Nome da unidade.
tipo (TEXT, CHECK): 'HOSPITAL', 'UPA', 'UBS'.
cnes (TEXT, UNIQUE, CHECK: 7 dígitos): Código Nacional de Estabelecimento de Saúde.
endereco_* (TEXT): Logradouro, número, bairro, cidade, estado (2 caracteres), CEP (8 dígitos).
telefone (TEXT, CHECK: ≥10 dígitos): Telefone de contato.
servicos_essenciais (TEXT[]): Serviços essenciais (ex.: ['Emergência', 'Cirurgia']).
servicos_ampliados (TEXT[]): Serviços adicionais (opcional).
created_at (TIMESTAMP): Data de criação.


Índices:
idx_unidade_saude_cnes: Para buscas por CNES.


Uso: Gerencia unidades de saúde e seus serviços.

4.1.4. consulta
Registra consultas médicas.

Colunas:
id (UUID, PK): Identificador único.
paciente_id (UUID, FK): Referencia paciente(id).
profissional_id (UUID, FK): Referencia funcionario(id).
unidade_saude_id (UUID, FK): Referencia unidade_saude(id).
observacoes (TEXT): Detalhes da consulta.
cid10 (TEXT, CHECK: formato CID-10): Código de diagnóstico (opcional).
data_consulta (TIMESTAMP): Data e hora da consulta.
created_at (TIMESTAMP): Data de criação.


Relacionamentos:
paciente_id → paciente(id) (RESTRICT).
profissional_id → funcionario(id) (RESTRICT).
unidade_saude_id → unidade_saude(id) (RESTRICT).


Índices:
idx_consulta_paciente_id: Para buscas por paciente.
idx_consulta_profissional_id: Para buscas por profissional.


Uso: Registra consultas realizadas.

4.1.5. prescricao
Registra prescrições médicas.

Colunas:
id (UUID, PK): Identificador único.
paciente_id (UUID, FK): Referencia paciente(id).
profissional_id (UUID, FK): Referencia funcionario(id).
detalhes_prescricao (TEXT): Instruções da prescrição.
cid10 (TEXT, CHECK: formato CID-10): Código de diagnóstico (opcional).
data_prescricao (TIMESTAMP): Data e hora da prescrição.
created_at (TIMESTAMP): Data de criação.


Relacionamentos:
paciente_id → paciente(id) (RESTRICT).
profissional_id → funcionario(id) (RESTRICT).


Índices:
idx_prescricao_paciente_id: Para buscas por paciente.
idx_prescricao_profissional_id: Para buscas por profissional.


Uso: Gerencia prescrições emitidas por médicos.

4.1.6. prontuario
Registra prontuários dos pacientes.

Colunas:
id (UUID, PK): Identificador único.
paciente_id (UUID, FK): Referencia paciente(id).
profissional_id (UUID, FK): Referencia funcionario(id).
descricao (TEXT): Detalhes do prontuário.
dados_anonimizados (BOOLEAN): Indica se os dados foram anonimizados.
created_at (TIMESTAMP): Data de criação.


Relacionamentos:
paciente_id → paciente(id) (RESTRICT).
profissional_id → funcionario(id) (RESTRICT).


Índices:
idx_prontuario_paciente_id: Para buscas por paciente.
idx_prontuario_profissional_id: Para buscas por profissional.


Uso: Armazena histórico médico dos pacientes.

4.1.7. triagem
Registra triagens realizadas por enfermeiros.

Colunas:
id (UUID, PK): Identificador único.
paciente_id (UUID, FK): Referencia paciente(id).
enfermeiro_id (UUID, FK): Referencia funcionario(id).
unidade_saude_id (UUID, FK): Referencia unidade_saude(id).
sinais_vitais (JSONB): Dados como pressão arterial, frequência cardíaca, etc.
queixa_principal (TEXT): Principal reclamação do paciente.
nivel_gravidade (TEXT, CHECK): 'VERMELHO', 'LARANJA', 'AMARELO', 'VERDE', 'AZUL'.
data_triagem (TIMESTAMP): Data e hora da triagem.
created_at (TIMESTAMP): Data de criação.


Relacionamentos:
paciente_id → paciente(id) (RESTRICT).
enfermeiro_id → funcionario(id) (RESTRICT).
unidade_saude_id → unidade_saude(id) (RESTRICT).


Índices:
idx_triagem_paciente_id: Para buscas por paciente.
idx_triagem_enfermeiro_id: Para buscas por enfermeiro.
idx_triagem_nivel_gravidade: Para buscas por nível de gravidade.


Uso: Gerencia triagens e priorização de atendimentos.

4.2. Diagrama ER
erDiagram
funcionario ||--o{ consulta : realiza
funcionario ||--o{ prescricao : emite
funcionario ||--o{ prontuario : registra
funcionario ||--o{ triagem : realiza
paciente ||--o{ consulta : participa
paciente ||--o{ prescricao : recebe
paciente ||--o{ prontuario : possui
paciente ||--o{ triagem : participa
unidade_saude ||--o{ consulta : sedia
unidade_saude ||--o{ triagem : sedia

    funcionario {
        UUID id PK
        TEXT email UNIQUE
        TEXT password
        TEXT papel CHECK
        TEXT nome
        TEXT cpf CHECK
        TEXT cns CHECK
        DATE data_nascimento
        TEXT sexo CHECK
        TEXT raca_cor CHECK
        TEXT escolaridade CHECK
        TEXT crm
        TEXT coren
        DATE data_contratacao
        TEXT endereco_logradouro
        TEXT endereco_numero
        TEXT endereco_complemento
        TEXT endereco_bairro
        TEXT endereco_cidade
        TEXT endereco_estado CHECK
        TEXT endereco_cep CHECK
        TEXT telefone CHECK
        TIMESTAMP created_at
    }

    paciente {
        UUID id PK
        TEXT nome
        TEXT cpf UNIQUE CHECK
        TEXT cns UNIQUE CHECK
        DATE data_nascimento
        TEXT sexo CHECK
        TEXT raca_cor CHECK
        TEXT escolaridade CHECK
        TEXT endereco_logradouro
        TEXT endereco_numero
        TEXT endereco_complemento
        TEXT endereco_bairro
        TEXT endereco_cidade
        TEXT endereco_estado CHECK
        TEXT endereco_cep CHECK
        TEXT telefone CHECK
        TEXT email CHECK
        TEXT[] grupos_risco
        BOOLEAN consentimento_lgpd
        TIMESTAMP created_at
    }

    unidade_saude {
        UUID id PK
        TEXT nome
        TEXT tipo CHECK
        TEXT cnes UNIQUE CHECK
        TEXT endereco_logradouro
        TEXT endereco_numero
        TEXT endereco_complemento
        TEXT endereco_bairro
        TEXT endereco_cidade
        TEXT endereco_estado CHECK
        TEXT endereco_cep CHECK
        TEXT telefone CHECK
        TEXT[] servicos_essenciais
        TEXT[] servicos_ampliados
        TIMESTAMP created_at
    }

    consulta {
        UUID id PK
        UUID paciente_id FK
        UUID profissional_id FK
        UUID unidade_saude_id FK
        TEXT observacoes
        TEXT cid10 CHECK
        TIMESTAMP data_consulta
        TIMESTAMP created_at
    }

    prescricao {
        UUID id PK
        UUID paciente_id FK
        UUID profissional_id FK
        TEXT detalhes_prescricao
        TEXT cid10 CHECK
        TIMESTAMP data_prescricao
        TIMESTAMP created_at
    }

    prontuario {
        UUID id PK
        UUID paciente_id FK
        UUID profissional_id FK
        TEXT descricao
        BOOLEAN dados_anonimizados
        TIMESTAMP created_at
    }

    triagem {
        UUID id PK
        UUID paciente_id FK
        UUID enfermeiro_id FK
        UUID unidade_saude_id FK
        JSONB sinais_vitais
        TEXT queixa_principal
        TEXT nivel_gravidade CHECK
        TIMESTAMP data_triagem
        TIMESTAMP created_at
    }

5. Configuração e Inicialização
   O banco de dados foi inicializado com um script SQL executado no Supabase SQL Editor, que:

Cria todas as tabelas com constraints e índices.
Habilita a extensão uuid-ossp para geração de UUIDs.
Insere dados de teste, incluindo:
Um médico (medico@hospital.com, senha: senha123, papel: MEDICO).
Um enfermeiro (enfermeiro@hospital.com, papel: ENFERMEIRO).
Um paciente.
Uma unidade de saúde.
Registros de consulta, prescrição, prontuário, e triagem.



Exemplo de Dados de Teste:
INSERT INTO funcionario (email, password, papel, nome, cpf, cns, data_nascimento, sexo, raca_cor, escolaridade, crm, data_contratacao, endereco_logradouro, endereco_numero, endereco_bairro, endereco_cidade, endereco_estado, endereco_cep, telefone)
VALUES ('medico@hospital.com', '$2a$10$3Qz7z9k2j5X8vY9wT6u2O.9q5x6z7y8w9v0u1i2o3p4q5r6s7t8u9', 'MEDICO', 'Dr. João Silva', '12345678901', '123456789012345', '1980-01-01', 'MASCULINO', 'BRANCA', 'SUPERIOR', 'CRM12345', '2023-01-01', 'Rua Exemplo', '123', 'Centro', 'São Paulo', 'SP', '12345678', '11987654321');

6. Integração com Autenticação
   O banco de dados integra-se ao Supabase Auth para gerenciar login de funcionários:

A tabela funcionario armazena credenciais (email, password) sincronizadas com a tabela interna auth.users.
O Supabase Auth gera access_token e refresh_token para sessões longas, essenciais para médicos e enfermeiros que permanecem logados por longos períodos.

7. Considerações de Segurança

Constraints: Garantem a integridade dos dados (ex.: CPF com 11 dígitos, papéis válidos).
Índices: Otimizam consultas frequentes (ex.: busca por CPF ou email).
Criptografia: Senhas são hasheadas com bcryptjs.
Restrições de Acesso: Relacionamentos com ON DELETE RESTRICT evitam exclusões acidentais.
LGPD: A coluna consentimento_lgpd em paciente registra o consentimento para uso de dados.

8. Escalabilidade e Manutenção

Escalabilidade: O Supabase suporta crescimento de dados com replicação e escalamento automático.
Manutenção: Backups diários e logs de consultas estão disponíveis no Supabase Dashboard.
Monitoramento: Índices garantem desempenho em consultas complexas (ex.: triagens por nível de gravidade).

9. Conclusão
   O banco de dados do sistema hospitalar, hospedado no Supabase, é robusto, seguro, e otimizado para gerenciar operações hospitalares. Com 7 tabelas, constraints rigorosas, índices para desempenho, e integração com Supabase Auth, ele atende aos requisitos de gerenciamento de pacientes, funcionários, e atendimentos, garantindo conformidade com padrões como LGPD e CID-10.
