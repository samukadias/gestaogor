const db = require('./db');

const seedDemands = async () => {
    try {
        console.log('Seeding demands...');

        // Get IDs for references (assuming they exist from initial seed)
        const analysts = await db.query('SELECT id FROM analysts');
        const analystId = analysts.rows[0]?.id || null;

        const requesters = await db.query('SELECT id FROM requesters');
        const requesterId = requesters.rows[0]?.id || null;

        // 1. Completed High Complexity Demand (for Complexity Chart)
        const demand1 = await db.query(`
            INSERT INTO demands (
                product, demand_number, status, artifact, complexity, weight, 
                analyst_id, requester_id, created_date, qualification_date, 
                delivery_date, expected_delivery_date
            ) VALUES (
                'Implementar Login SSO', 'DEM-001', 'ENTREGUE', 'Backend', 'Alta', 13,
                $1, $2, NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days', 
                NOW(), NOW() + INTERVAL '2 days'
            ) RETURNING id
        `, [analystId, requesterId]);

        const d1Id = demand1.rows[0].id;

        // History for Demand 1 (for Bottleneck Chart)
        await db.query(`
            INSERT INTO status_history (demand_id, from_status, to_status, changed_at, time_in_previous_status_minutes, changed_by)
            VALUES 
            ($1, NULL, 'PENDENTE TRIAGEM', NOW() - INTERVAL '15 days', 0, 'system'),
            ($1, 'PENDENTE TRIAGEM', 'DESIGNADA', NOW() - INTERVAL '14 days', 1440, 'gestor@fluxo.com'),
            ($1, 'DESIGNADA', 'EM ANDAMENTO', NOW() - INTERVAL '10 days', 5760, 'responsavel@fluxo.com'),
            ($1, 'EM ANDAMENTO', 'PENDÊNCIA FORNECEDOR', NOW() - INTERVAL '5 days', 7200, 'responsavel@fluxo.com'),
            ($1, 'PENDÊNCIA FORNECEDOR', 'ENTREGUE', NOW(), 7200, 'responsavel@fluxo.com')
        `, [d1Id]);

        // 2. In Progress Medium Demand (for Bottleneck Chart)
        const demand2 = await db.query(`
            INSERT INTO demands (
                product, demand_number, status, artifact, complexity, weight, 
                analyst_id, requester_id, created_date, qualification_date, 
                expected_delivery_date
            ) VALUES (
                'Ajuste de Relatório', 'DEM-002', 'EM ANDAMENTO', 'Frontend', 'Média', 5,
                $1, $2, NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', 
                NOW() + INTERVAL '5 days'
            ) RETURNING id
        `, [analystId, requesterId]);

        const d2Id = demand2.rows[0].id;

        // History for Demand 2
        await db.query(`
            INSERT INTO status_history (demand_id, from_status, to_status, changed_at, time_in_previous_status_minutes, changed_by)
            VALUES 
            ($1, NULL, 'PENDENTE TRIAGEM', NOW() - INTERVAL '5 days', 0, 'system'),
            ($1, 'PENDENTE TRIAGEM', 'EM ANDAMENTO', NOW() - INTERVAL '4 days', 1440, 'gestor@fluxo.com')
        `, [d2Id]);

        // 3. Completed Low Complexity Demand
        const demand3 = await db.query(`
            INSERT INTO demands (
                product, demand_number, status, artifact, complexity, weight, 
                analyst_id, requester_id, created_date, qualification_date, 
                delivery_date, expected_delivery_date
            ) VALUES (
                'Alteração de Cor', 'DEM-003', 'ENTREGUE', 'Frontend', 'Baixa', 2,
                $1, $2, NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', 
                NOW(), NOW() + INTERVAL '1 days'
            ) RETURNING id
        `, [analystId, requesterId]);

        const d3Id = demand3.rows[0].id;

        // History for Demand 3
        await db.query(`
            INSERT INTO status_history (demand_id, from_status, to_status, changed_at, time_in_previous_status_minutes, changed_by)
            VALUES 
            ($1, NULL, 'PENDENTE TRIAGEM', NOW() - INTERVAL '5 days', 0, 'system'),
            ($1, 'PENDENTE TRIAGEM', 'DESIGNADA', NOW() - INTERVAL '4 days', 1440, 'gestor@fluxo.com'),
            ($1, 'DESIGNADA', 'EM ANDAMENTO', NOW() - INTERVAL '3 days', 1440, 'responsavel@fluxo.com'),
            ($1, 'EM ANDAMENTO', 'ENTREGUE', NOW(), 4320, 'responsavel@fluxo.com')
        `, [d3Id]);

        // 4. Completed Medium Complexity Demand
        const demand4 = await db.query(`
            INSERT INTO demands (
                product, demand_number, status, artifact, complexity, weight, 
                analyst_id, requester_id, created_date, qualification_date, 
                delivery_date, expected_delivery_date
            ) VALUES (
                'Nova Rota API', 'DEM-004', 'ENTREGUE', 'Backend', 'Média', 5,
                $1, $2, NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', 
                NOW(), NOW() + INTERVAL '2 days'
            ) RETURNING id
        `, [analystId, requesterId]);

        const d4Id = demand4.rows[0].id;

        // History for Demand 4
        await db.query(`
            INSERT INTO status_history (demand_id, from_status, to_status, changed_at, time_in_previous_status_minutes, changed_by)
            VALUES 
            ($1, NULL, 'PENDENTE TRIAGEM', NOW() - INTERVAL '10 days', 0, 'system'),
            ($1, 'PENDENTE TRIAGEM', 'DESIGNADA', NOW() - INTERVAL '9 days', 1440, 'gestor@fluxo.com'),
            ($1, 'DESIGNADA', 'EM ANDAMENTO', NOW() - INTERVAL '7 days', 2880, 'responsavel@fluxo.com'),
            ($1, 'EM ANDAMENTO', 'ENTREGUE', NOW(), 10080, 'responsavel@fluxo.com')
        `, [d4Id]);

        console.log('Demands seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding demands:', err);
        process.exit(1);
    }
};

seedDemands();
