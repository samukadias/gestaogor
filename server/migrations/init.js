const db = require('../db');

/**
 * Initialize all database tables. 
 * Extracted from the original monolithic index.js for separation of concerns.
 */
const initDb = async () => {
    try {
        // ========================================
        // CORE TABLES
        // ========================================

        // Users Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255),
                email VARCHAR(255) UNIQUE,
                password VARCHAR(255),
                role VARCHAR(50),
                department VARCHAR(50),
                profile_type VARCHAR(50),
                allowed_modules TEXT[] DEFAULT '{flow}'
            )
        `);

        // Contracts (Core Table)
        await db.query(`
            CREATE TABLE IF NOT EXISTS contracts (
                id SERIAL PRIMARY KEY,
                contract_number VARCHAR(50),
                object TEXT,
                company_name VARCHAR(255),
                start_date TIMESTAMP,
                end_date TIMESTAMP,
                total_value DECIMAL(15, 2),
                current_balance DECIMAL(15, 2),
                status VARCHAR(50) DEFAULT 'active'
            )
        `);

        // Confirmation Terms
        await db.query(`
            CREATE TABLE IF NOT EXISTS confirmation_terms (
                id SERIAL PRIMARY KEY,
                contrato_associado_pd VARCHAR(255),
                valor_total DECIMAL(15, 2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Analysts
        await db.query(`
            CREATE TABLE IF NOT EXISTS analysts (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE,
                email VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Clients
        await db.query(`
            CREATE TABLE IF NOT EXISTS clients (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                sigla VARCHAR(50),
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Demands Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS demands (
                id SERIAL PRIMARY KEY,
                product VARCHAR(255),
                demand_number VARCHAR(50),
                status VARCHAR(50),
                artifact VARCHAR(255),
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
                support_analyst_id INTEGER,
                delivery_date_change_reason TEXT,
                contract_id INTEGER REFERENCES contracts(id),
                stage VARCHAR(50)
            )
        `);

        // Migrations for existing columns
        const coreMigrations = [
            'ALTER TABLE demands ADD COLUMN IF NOT EXISTS support_analyst_id INTEGER',
            'ALTER TABLE demands ADD COLUMN IF NOT EXISTS architect_support_analyst_id INTEGER',
            'ALTER TABLE demands ADD COLUMN IF NOT EXISTS stage VARCHAR(50)',
            'ALTER TABLE demands ADD COLUMN IF NOT EXISTS value DECIMAL(15, 2)',
            'ALTER TABLE users ADD COLUMN IF NOT EXISTS allowed_modules TEXT[] DEFAULT \'{flow}\'',
            'ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(50)',
            'ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_type VARCHAR(50)',
        ];

        for (const sql of coreMigrations) {
            try { await db.query(sql); } catch (e) { /* column already exists */ }
        }

        // Status History
        await db.query(`
            CREATE TABLE IF NOT EXISTS status_history (
                id SERIAL PRIMARY KEY,
                demand_id INTEGER REFERENCES demands(id),
                from_status VARCHAR(50),
                to_status VARCHAR(50),
                changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                time_in_previous_status_minutes INTEGER,
                changed_by VARCHAR(255)
            )
        `);

        // Stage History
        await db.query(`
            CREATE TABLE IF NOT EXISTS stage_history (
                id SERIAL PRIMARY KEY,
                demand_id INTEGER REFERENCES demands(id),
                stage VARCHAR(50),
                entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                exited_at TIMESTAMP,
                duration_minutes INTEGER,
                changed_by VARCHAR(255)
            )
        `);

        // Cycles
        await db.query(`
            CREATE TABLE IF NOT EXISTS cycles (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255)
            )
        `);

        // Requesters
        await db.query(`
            CREATE TABLE IF NOT EXISTS requesters (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255),
                email VARCHAR(255)
            )
        `);

        // Holidays
        await db.query(`
            CREATE TABLE IF NOT EXISTS holidays (
                id SERIAL PRIMARY KEY,
                date TIMESTAMP,
                name VARCHAR(255)
            )
        `);

        // ========================================
        // LEGACY COLUMNS ON CONTRACTS (Prazos)
        // ========================================
        const legacyCols = [
            'ADD COLUMN IF NOT EXISTS analista_responsavel VARCHAR(255)',
            'ADD COLUMN IF NOT EXISTS cliente VARCHAR(255)',
            'ADD COLUMN IF NOT EXISTS grupo_cliente VARCHAR(255)',
            'ADD COLUMN IF NOT EXISTS contrato VARCHAR(100)',
            'ADD COLUMN IF NOT EXISTS termo VARCHAR(100)',
            'ADD COLUMN IF NOT EXISTS status_vencimento VARCHAR(50)',
            'ADD COLUMN IF NOT EXISTS data_inicio_efetividade TIMESTAMP',
            'ADD COLUMN IF NOT EXISTS data_fim_efetividade TIMESTAMP',
            'ADD COLUMN IF NOT EXISTS data_limite_andamento TIMESTAMP',
            'ADD COLUMN IF NOT EXISTS valor_contrato DECIMAL(15, 2)',
            'ADD COLUMN IF NOT EXISTS valor_faturado DECIMAL(15, 2)',
            'ADD COLUMN IF NOT EXISTS valor_cancelado DECIMAL(15, 2)',
            'ADD COLUMN IF NOT EXISTS valor_a_faturar DECIMAL(15, 2)',
            'ADD COLUMN IF NOT EXISTS valor_novo_contrato DECIMAL(15, 2)',
            'ADD COLUMN IF NOT EXISTS tipo_tratativa VARCHAR(100)',
            'ADD COLUMN IF NOT EXISTS tipo_aditamento VARCHAR(100)',
            'ADD COLUMN IF NOT EXISTS etapa TEXT',
            'ADD COLUMN IF NOT EXISTS objeto TEXT',
            'ADD COLUMN IF NOT EXISTS secao_responsavel VARCHAR(100)',
            'ADD COLUMN IF NOT EXISTS observacao TEXT',
            'ADD COLUMN IF NOT EXISTS numero_processo_sei_nosso VARCHAR(100)',
            'ADD COLUMN IF NOT EXISTS numero_processo_sei_cliente VARCHAR(100)',
            'ADD COLUMN IF NOT EXISTS contrato_cliente VARCHAR(100)',
            'ADD COLUMN IF NOT EXISTS contrato_anterior VARCHAR(100)',
            'ADD COLUMN IF NOT EXISTS numero_pnpp_crm VARCHAR(100)',
            'ADD COLUMN IF NOT EXISTS sei VARCHAR(100)',
            'ADD COLUMN IF NOT EXISTS contrato_novo VARCHAR(100)',
            'ADD COLUMN IF NOT EXISTS termo_novo VARCHAR(100)',
            'ADD COLUMN IF NOT EXISTS created_by VARCHAR(255)',
        ];

        for (const col of legacyCols) {
            try { await db.query(`ALTER TABLE contracts ${col}`); } catch (e) { /* exists */ }
        }

        // Fix contract_number to be nullable
        try {
            await db.query('ALTER TABLE contracts ALTER COLUMN contract_number DROP NOT NULL');
        } catch (e) { /* already nullable */ }

        // Finance columns on contracts
        const financeCols = [
            'ADD COLUMN IF NOT EXISTS client_name VARCHAR(255)',
            'ADD COLUMN IF NOT EXISTS responsible_analyst VARCHAR(255)',
            'ADD COLUMN IF NOT EXISTS pd_number VARCHAR(50)',
            'ADD COLUMN IF NOT EXISTS sei_process_number VARCHAR(50)',
            'ADD COLUMN IF NOT EXISTS sei_send_area VARCHAR(100)',
            'ADD COLUMN IF NOT EXISTS esps JSONB DEFAULT \'[]\'',
            'ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        ];

        for (const col of financeCols) {
            try { await db.query(`ALTER TABLE contracts ${col}`); } catch (e) { /* exists */ }
        }

        // ========================================
        // MODULE-SPECIFIC TABLES
        // ========================================

        // Finance Contracts
        await db.query(`
            CREATE TABLE IF NOT EXISTS finance_contracts (
                id SERIAL PRIMARY KEY,
                client_name VARCHAR(255) NOT NULL,
                pd_number VARCHAR(50) NOT NULL,
                responsible_analyst VARCHAR(255),
                sei_process_number VARCHAR(50),
                sei_send_area VARCHAR(100),
                esps JSONB DEFAULT '[]',
                cocr_contract_id INTEGER,
                grupo_cliente VARCHAR(100),
                termo VARCHAR(100),
                objeto TEXT,
                data_inicio_efetividade TIMESTAMP,
                data_fim_efetividade TIMESTAMP,
                status_vigencia VARCHAR(50),
                gestor_email VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Finance Contracts — migration for existing rows
        const financeContractMigrations = [
            'ADD COLUMN IF NOT EXISTS cocr_contract_id INTEGER',
            'ADD COLUMN IF NOT EXISTS grupo_cliente VARCHAR(100)',
            'ADD COLUMN IF NOT EXISTS termo VARCHAR(100)',
            'ADD COLUMN IF NOT EXISTS objeto TEXT',
            'ADD COLUMN IF NOT EXISTS data_inicio_efetividade TIMESTAMP',
            'ADD COLUMN IF NOT EXISTS data_fim_efetividade TIMESTAMP',
            'ADD COLUMN IF NOT EXISTS status_vigencia VARCHAR(50)',
            'ADD COLUMN IF NOT EXISTS gestor_email VARCHAR(255)',
        ];
        for (const col of financeContractMigrations) {
            try { await db.query(`ALTER TABLE finance_contracts ${col}`); } catch (e) { /* exists */ }
        }

        // Deadline Contracts
        await db.query(`
            CREATE TABLE IF NOT EXISTS deadline_contracts (
                id SERIAL PRIMARY KEY,
                analista_responsavel VARCHAR(255),
                cliente VARCHAR(255),
                grupo_cliente VARCHAR(255),
                contrato VARCHAR(255),
                termo VARCHAR(255),
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
                tipo_tratativa VARCHAR(255),
                tipo_aditamento VARCHAR(255),
                etapa TEXT,
                secao_responsavel VARCHAR(255),
                observacao TEXT,
                numero_processo_sei_nosso VARCHAR(255),
                numero_processo_sei_cliente VARCHAR(255),
                contrato_cliente VARCHAR(255),
                contrato_anterior VARCHAR(255),
                numero_pnpp_crm VARCHAR(255),
                sei VARCHAR(255),
                contrato_novo VARCHAR(255),
                termo_novo VARCHAR(255),
                created_by VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Data Migration (Legacy → New Tables)
        try {
            const financeCount = await db.query('SELECT COUNT(*) FROM finance_contracts');
            const deadlineCount = await db.query('SELECT COUNT(*) FROM deadline_contracts');

            if (parseInt(financeCount.rows[0].count) === 0) {
                await db.query(`
                    INSERT INTO finance_contracts (
                        client_name, pd_number, responsible_analyst,
                        sei_process_number, sei_send_area, esps, created_at
                    )
                    SELECT
                        COALESCE(client_name, company_name, 'Sem Cliente'),
                        COALESCE(pd_number, contract_number, 'Sem PD'),
                        COALESCE(responsible_analyst, analista_responsavel),
                        sei_process_number, sei_send_area, esps, created_at
                    FROM contracts
                    WHERE client_name IS NOT NULL OR pd_number IS NOT NULL OR esps IS NOT NULL
                `);
            }

            if (parseInt(deadlineCount.rows[0].count) === 0) {
                await db.query(`
                    INSERT INTO deadline_contracts (
                        analista_responsavel, cliente, grupo_cliente, contrato, termo,
                        status, status_vencimento, data_inicio_efetividade, data_fim_efetividade,
                        data_limite_andamento, valor_contrato, valor_faturado, valor_cancelado,
                        valor_a_faturar, valor_novo_contrato, objeto, tipo_tratativa,
                        tipo_aditamento, etapa, secao_responsavel, observacao,
                        numero_processo_sei_nosso, numero_processo_sei_cliente,
                        contrato_cliente, contrato_anterior, numero_pnpp_crm, sei,
                        contrato_novo, termo_novo, created_by, created_at
                    )
                    SELECT
                        analista_responsavel, cliente, grupo_cliente, contrato, termo,
                        status, status_vencimento, data_inicio_efetividade, data_fim_efetividade,
                        data_limite_andamento, valor_contrato, valor_faturado, valor_cancelado,
                        valor_a_faturar, valor_novo_contrato, objeto, tipo_tratativa,
                        tipo_aditamento, etapa, secao_responsavel, observacao,
                        numero_processo_sei_nosso, numero_processo_sei_cliente,
                        contrato_cliente, contrato_anterior, numero_pnpp_crm, sei,
                        contrato_novo, termo_novo, created_by, created_at
                    FROM contracts
                    WHERE contrato IS NOT NULL OR cliente IS NOT NULL
                `);
            }
        } catch (migrationErr) {
            console.error('Migration warning:', migrationErr.message);
        }

        // Monthly Attestations
        await db.query(`
            CREATE TABLE IF NOT EXISTS monthly_attestations (
                id SERIAL PRIMARY KEY,
                contract_id INTEGER REFERENCES finance_contracts(id),
                client_name VARCHAR(255),
                pd_number VARCHAR(50),
                responsible_analyst VARCHAR(255),
                esp_number VARCHAR(50),
                sei_process_number VARCHAR(50),
                sei_send_area VARCHAR(100),
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
            )
        `);

        const attestationCols = [
            'ADD COLUMN IF NOT EXISTS sei_process_number VARCHAR(50)',
            'ADD COLUMN IF NOT EXISTS sei_send_area VARCHAR(100)',
            'ADD COLUMN IF NOT EXISTS measurement_value DECIMAL(15, 2)',
            'ADD COLUMN IF NOT EXISTS esp_value DECIMAL(15, 2)',
            'ADD COLUMN IF NOT EXISTS gestor_email VARCHAR(255)',
            'ADD COLUMN IF NOT EXISTS nfe_sharepoint_date DATE',
            'ADD COLUMN IF NOT EXISTS nfe_issue_date DATE',
            'ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        ];
        for (const col of attestationCols) {
            try { await db.query(`ALTER TABLE monthly_attestations ${col}`); } catch (e) { /* exists */ }
        }

        // Termos Confirmacao
        await db.query(`
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
            )
        `);

        // Invoices
        await db.query(`
            CREATE TABLE IF NOT EXISTS invoices (
                id SERIAL PRIMARY KEY,
                contract_id INTEGER REFERENCES contracts(id),
                invoice_number VARCHAR(50),
                amount DECIMAL(15, 2),
                issue_date TIMESTAMP,
                status VARCHAR(50)
            )
        `);

        // ========================================
        // NEW TABLES (Notifications + Audit Trail)
        // ========================================

        // Notifications
        await db.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                type VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT,
                read BOOLEAN DEFAULT FALSE,
                entity_type VARCHAR(50),
                entity_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Activity Log (Audit Trail)
        await db.query(`
            CREATE TABLE IF NOT EXISTS activity_log (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                user_name VARCHAR(255),
                action VARCHAR(20) NOT NULL,
                entity VARCHAR(100) NOT NULL,
                entity_id INTEGER,
                changes JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // ========================================
        // REABERTURA DE DEMANDAS
        // ========================================

        // Motivos de reabertura (configuráveis pelo gestor)
        await db.query(`
            CREATE TABLE IF NOT EXISTS demand_reopening_reasons (
                id SERIAL PRIMARY KEY,
                label VARCHAR(255) NOT NULL,
                active BOOLEAN DEFAULT TRUE,
                created_by VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Seed de motivos padrão (só se a tabela estiver vazia)
        const reasonCount = await db.query('SELECT COUNT(*) FROM demand_reopening_reasons');
        if (parseInt(reasonCount.rows[0].count) === 0) {
            const defaultReasons = [
                'Erro no produto entregue',
                'Requisito não atendido completamente',
                'Solicitação de alteração pelo cliente',
                'Retrabalho por processo interno',
                'Complemento de escopo',
                'Outro'
            ];
            for (const label of defaultReasons) {
                await db.query(
                    `INSERT INTO demand_reopening_reasons (label, created_by) VALUES ($1, 'Sistema')`,
                    [label]
                );
            }
        }

        // Histórico de reaberturas por demanda
        await db.query(`
            CREATE TABLE IF NOT EXISTS demand_reopenings (
                id SERIAL PRIMARY KEY,
                demand_id INTEGER REFERENCES demands(id) ON DELETE CASCADE,
                reason_id INTEGER REFERENCES demand_reopening_reasons(id),
                reason_label VARCHAR(255),
                detail TEXT,
                reopened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reopened_by_id INTEGER REFERENCES users(id),
                reopened_by_name VARCHAR(255),
                redelivered_at TIMESTAMP,
                redelivered_by_name VARCHAR(255)
            )
        `);

        // ========================================
        // PERFORMANCE INDEXES
        // ========================================
        // demands - columns most used in WHERE and ORDER BY clauses
        await db.query(`CREATE INDEX IF NOT EXISTS idx_demands_status ON demands(status)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_demands_cycle_id ON demands(cycle_id)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_demands_client_id ON demands(client_id)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_demands_analyst_id ON demands(analyst_id)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_demands_artifact ON demands(artifact)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_demands_delivery_date ON demands(delivery_date)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_demands_created_date ON demands(created_date)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_demands_qualification_date ON demands(qualification_date)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_demands_weight ON demands(weight)`);

        // contracts - columns most used in WHERE clauses (metrics + listings)
        await db.query(`CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_contracts_cliente ON contracts(cliente)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_contracts_tipo_tratativa ON contracts(tipo_tratativa)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_contracts_data_fim ON contracts(data_fim_efetividade)`);

        // notifications - for fast per-user queries
        await db.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)`);

        // activity_log - for user-based audit filtering
        await db.query(`CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity)`);

        console.log('✅ Database tables initialized successfully');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
};

module.exports = initDb;
