-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    role VARCHAR(50),
    department VARCHAR(50),
    allowed_modules TEXT [] DEFAULT '{flow}'
);
-- Demands Table
CREATE TABLE IF NOT EXISTS demands (
    id SERIAL PRIMARY KEY,
    product VARCHAR(255),
    demand_number VARCHAR(50),
    status VARCHAR(50),
    artifact VARCHAR(100),
    complexity VARCHAR(50),
    weight INTEGER,
    client_id INTEGER,
    analyst_id INTEGER,
    cycle_id INTEGER,
    requester_id INTEGER,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    qualification_date TIMESTAMP,
    expected_delivery_date TIMESTAMP,
    delivery_date TIMESTAMP,
    observation TEXT,
    frozen_time_minutes INTEGER DEFAULT 0,
    last_frozen_at TIMESTAMP,
    support_analyst_id INTEGER -- contract_id added later if needed or in definition if strictly ordered, but index.js has it inside CREATE.
    -- Wait, looking at index.js line 175: contract_id INTEGER REFERENCES contracts(id)
    -- But contracts table is created AFTER demands in the code order in index.js?
    -- No, in index.js:
    -- 1. users
    -- 2. demands (references contracts(id)??) -> This would fail if contracts doesn't exist yet!
    -- Let's check index.js line 175.
    -- Yes: "contract_id INTEGER REFERENCES contracts(id)"
    -- And contracts is created at line 245.
    -- If Postgres checks references immediately, index.js initDb would FAIL on first run?!
    -- Unless the "IF NOT EXISTS" logic masks it or I misread the order.
    -- Ah, maybe the developer relied on it failing/being added later?
    -- Safest is to create 'contracts' BEFORE 'demands'.
);
-- Cycles
CREATE TABLE IF NOT EXISTS cycles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255)
);
-- Requesters
CREATE TABLE IF NOT EXISTS requesters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255)
);
-- Holidays
CREATE TABLE IF NOT EXISTS holidays (
    id SERIAL PRIMARY KEY,
    date TIMESTAMP,
    name VARCHAR(255)
);
-- Contracts (New Core Table) - Moving UP before Demands/others that reference it
CREATE TABLE IF NOT EXISTS contracts (
    id SERIAL PRIMARY KEY,
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    object TEXT,
    company_name VARCHAR(255),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    total_value DECIMAL(15, 2),
    current_balance DECIMAL(15, 2),
    status VARCHAR(50) DEFAULT 'active'
);
-- Clients (There are two clients tables in index.js? One at line 210, one at 465?)
-- Line 210: id, name, active default true
-- Line 465: id, name unique not null, created_at
-- This is a conflict in index.js too!
-- I will use the first one (most standard) and adding columns from second if needed.
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Analysts (Also duplicate in index.js? Line 201 and 474)
-- Line 201: id, name, email
-- Line 474: id, name, created_at
-- I will merge:
CREATE TABLE IF NOT EXISTS analysts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Status History
CREATE TABLE IF NOT EXISTS status_history (
    id SERIAL PRIMARY KEY,
    demand_id INTEGER,
    -- Removed REFERENCES demands(id) to avoid circular dependency issues if created out of order, or keep it if demands exists.
    from_status VARCHAR(50),
    to_status VARCHAR(50),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    time_in_previous_status_minutes INTEGER,
    changed_by VARCHAR(255)
);
-- Fix Demands FK
ALTER TABLE demands
ADD COLUMN IF NOT EXISTS contract_id INTEGER REFERENCES contracts(id);
-- Migrations for existing tables (from index.js)
ALTER TABLE demands
ADD COLUMN IF NOT EXISTS support_analyst_id INTEGER;
ALTER TABLE users
ADD COLUMN IF NOT EXISTS allowed_modules TEXT [] DEFAULT '{flow}';
ALTER TABLE users
ADD COLUMN IF NOT EXISTS department VARCHAR(50);
ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_type VARCHAR(50);
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE analysts
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
-- Finance/Performance Columns for Demands
ALTER TABLE demands
ADD COLUMN IF NOT EXISTS margem_bruta DECIMAL(5, 2);
ALTER TABLE demands
ADD COLUMN IF NOT EXISTS margem_liquida DECIMAL(5, 2);
-- Legacy Columns for Contracts
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS analista_responsavel VARCHAR(255);
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS cliente VARCHAR(255);
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS grupo_cliente VARCHAR(255);
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS contrato VARCHAR(100);
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS termo VARCHAR(100);
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS status_vencimento VARCHAR(50);
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS data_inicio_efetividade TIMESTAMP;
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS data_fim_efetividade TIMESTAMP;
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS data_limite_andamento TIMESTAMP;
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS valor_contrato DECIMAL(15, 2);
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS valor_faturado DECIMAL(15, 2);
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS valor_cancelado DECIMAL(15, 2);
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS valor_a_faturar DECIMAL(15, 2);
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS valor_novo_contrato DECIMAL(15, 2);
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS tipo_tratativa VARCHAR(100);
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS tipo_aditamento VARCHAR(100);
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS valor_aditamento DECIMAL(15, 2);
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS etapa TEXT;
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS objeto TEXT;
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS secao_responsavel VARCHAR(100);
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS observacao TEXT;
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS numero_processo_sei_nosso VARCHAR(100);
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS numero_processo_sei_cliente VARCHAR(100);
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS contrato_cliente VARCHAR(100);
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS contrato_anterior VARCHAR(100);
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS numero_pnpp_crm VARCHAR(100);
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS sei VARCHAR(100);
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS contrato_novo VARCHAR(100);
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS termo_novo VARCHAR(100);
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS margem_bruta DECIMAL(5, 2);
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS margem_liquida DECIMAL(5, 2);
-- Fix contract_number nullable
ALTER TABLE contracts
ALTER COLUMN contract_number DROP NOT NULL;
-- Finance Columns
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS client_name VARCHAR(255);
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS responsible_analyst VARCHAR(255);
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS pd_number VARCHAR(50);
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS sei_process_number VARCHAR(50);
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS sei_send_area VARCHAR(100);
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS esps JSONB DEFAULT '[]';
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
-- Finance Contracts
CREATE TABLE IF NOT EXISTS finance_contracts (
    id SERIAL PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    pd_number VARCHAR(50) NOT NULL,
    responsible_analyst VARCHAR(255),
    sei_process_number VARCHAR(50),
    sei_send_area VARCHAR(100),
    esps JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Deadline Contracts
CREATE TABLE IF NOT EXISTS deadline_contracts (
    id SERIAL PRIMARY KEY,
    analista_responsavel VARCHAR(255),
    cliente VARCHAR(255),
    grupo_cliente VARCHAR(255),
    contrato VARCHAR(100),
    termo VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Ativo',
    status_vencimento VARCHAR(50),
    data_inicio_efetividade TIMESTAMP,
    data_fim_efetividade TIMESTAMP,
    data_limite_andamento TIMESTAMP,
    valor_contrato DECIMAL(15, 2),
    valor_faturado DECIMAL(15, 2),
    valor_cancelado DECIMAL(15, 2),
    valor_a_faturar DECIMAL(15, 2),
    valor_novo_contrato DECIMAL(15, 2),
    objeto TEXT,
    tipo_tratativa VARCHAR(100),
    tipo_aditamento VARCHAR(100),
    etapa TEXT,
    secao_responsavel VARCHAR(100),
    observacao TEXT,
    numero_processo_sei_nosso VARCHAR(100),
    numero_processo_sei_cliente VARCHAR(100),
    contrato_cliente VARCHAR(100),
    contrato_anterior VARCHAR(100),
    numero_pnpp_crm VARCHAR(100),
    sei VARCHAR(100),
    contrato_novo VARCHAR(100),
    termo_novo VARCHAR(100),
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    margem_bruta DECIMAL(5, 2),
    margem_liquida DECIMAL(5, 2),
    valor_aditamento DECIMAL(15, 2)
);
-- Monthly Attestations
CREATE TABLE IF NOT EXISTS monthly_attestations (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER REFERENCES contracts(id),
    client_name VARCHAR(255),
    pd_number VARCHAR(50),
    responsible_analyst VARCHAR(255),
    esp_number VARCHAR(50),
    reference_month VARCHAR(10),
    report_generation_date DATE,
    report_send_date DATE,
    attestation_return_date DATE,
    invoice_send_to_client_date DATE,
    invoice_number VARCHAR(50),
    billed_amount DECIMAL(15, 2),
    paid_amount DECIMAL(15, 2),
    invoice_send_date DATE,
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Termos Confirmacao
CREATE TABLE IF NOT EXISTS termos_confirmacao (
    id SERIAL PRIMARY KEY,
    numero_tc VARCHAR(50),
    contrato_associado_pd VARCHAR(50),
    numero_processo VARCHAR(50),
    data_inicio_vigencia TIMESTAMP,
    data_fim_vigencia TIMESTAMP,
    valor_total DECIMAL(15, 2),
    objeto TEXT,
    area_demandante VARCHAR(100),
    fiscal_contrato VARCHAR(255),
    gestor_contrato VARCHAR(255),
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
-- Invoices
CREATE TABLE IF NOT EXISTS invoices(
    id SERIAL PRIMARY KEY,
    contract_id INTEGER REFERENCES contracts(id),
    invoice_number VARCHAR(50),
    amount DECIMAL(15, 2),
    issue_date TIMESTAMP,
    status VARCHAR(50)
);