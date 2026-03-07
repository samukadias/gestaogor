-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_demands_status ON demands(status);
CREATE INDEX IF NOT EXISTS idx_demands_analyst_id ON demands(analyst_id);
CREATE INDEX IF NOT EXISTS idx_demands_client_id ON demands(client_id);
CREATE INDEX IF NOT EXISTS idx_demands_created_date ON demands(created_date);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_data_fim ON contracts(data_fim_efetividade);
CREATE INDEX IF NOT EXISTS idx_contracts_data_inicio ON contracts(data_inicio_efetividade);