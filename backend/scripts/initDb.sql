-- Tabela patients
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  sus_number VARCHAR(15) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  data_nasc DATE NOT NULL,
  endereco TEXT,
  contato VARCHAR(20)
);

-- Tabela professionals
CREATE TABLE professionals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  nome VARCHAR(255) NOT NULL,
  crm_coren VARCHAR(20) UNIQUE NOT NULL,
  especializacao VARCHAR(100),
  unidade_saude VARCHAR(100),
  cargo VARCHAR(50)
);

-- Tabela prontuarios
CREATE TABLE prontuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id),
  history JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela triagens
CREATE TABLE triagens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id),
  sinais_vitais JSONB,
  sintomas TEXT,
  classificacao_risco VARCHAR(10),
  data_hora TIMESTAMP DEFAULT NOW()
);

-- Tabela agendamentos
CREATE TABLE agendamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id),
  professional_id UUID REFERENCES professionals(id),
  data_hora TIMESTAMP NOT NULL,
  tipo VARCHAR(50),
  prioridade BOOLEAN DEFAULT FALSE
);

-- Tabela prescricoes
CREATE TABLE prescricoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id),
  professional_id UUID REFERENCES professionals(id),
  detalhes JSONB NOT NULL,
  data TIMESTAMP DEFAULT NOW()
);

-- Tabela encaminhamentos
CREATE TABLE encaminhamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id),
  professional_id UUID REFERENCES professionals(id),
  especialidade VARCHAR(100),
  motivo TEXT,
  urgencia BOOLEAN,
  status VARCHAR(20) DEFAULT 'pendente',
  data TIMESTAMP DEFAULT NOW()
);

-- Tabela logs (Segurança)
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  acao VARCHAR(255),
  data_hora TIMESTAMP DEFAULT NOW(),
  detalhes TEXT
);

-- Habilitar RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE prontuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE triagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescricoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE encaminhamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas
CREATE POLICY patient_access ON patients FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY professional_access ON professionals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY prontuario_access ON prontuarios FOR SELECT TO authenticated USING (auth.role() = 'patient' AND patient_id = (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY triagem_access ON triagens FOR SELECT TO authenticated USING (auth.role() = 'patient' AND patient_id = (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY agendamento_access ON agendamentos FOR SELECT TO authenticated USING (auth.role() = 'patient' AND patient_id = (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY prescricao_access ON prescricoes FOR SELECT TO authenticated USING (auth.role() = 'patient' AND patient_id = (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY encaminhamento_access ON encaminhamentos FOR SELECT TO authenticated USING (auth.role() = 'patient' AND patient_id = (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY log_access ON logs FOR SELECT TO authenticated USING (auth.role() = 'admin');

-- Trigger para logs
CREATE FUNCTION log_action() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO logs (user_id, acao, detalhes)
  VALUES (auth.uid(), TG_OP, row_to_json(NEW)::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_patient_changes AFTER INSERT OR UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION log_action();