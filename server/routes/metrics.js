const express = require('express');
const db = require('../db');

const router = express.Router();

/**
 * GET /metrics/cdpc
 * High-performance aggregation for CDPC Dashboard
 * Supports Query Params: month, year, cycle_ids, artifact
 */
router.get('/cdpc', async (req, res) => {
    const client = await db.connect();
    try {
        const { month, year, cycle_ids, artifact } = req.query;

        // Validate and parse year/month to prevent SQL injection via interpolation
        const rawYear = year ? parseInt(year, 10) : new Date().getFullYear();
        const rawMonth = month ? parseInt(month, 10) : null;

        if (isNaN(rawYear) || rawYear < 2000 || rawYear > 2100) {
            return res.status(400).json({ error: 'Invalid year parameter.' });
        }
        if (rawMonth !== null && (isNaN(rawMonth) || rawMonth < 1 || rawMonth > 12)) {
            return res.status(400).json({ error: 'Invalid month parameter. Must be between 1 and 12.' });
        }

        const currentYear = rawYear;
        const currentMonth = rawMonth;

        // Base WHERE clause for parameterized filtering on general queries
        let baseWhere = '1=1';
        let values = [];
        let paramsCount = 1;

        if (cycle_ids) {
            // Parses '1,2,3' string into [1, 2, 3] array
            const idArray = cycle_ids.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
            if (idArray.length > 0) {
                baseWhere += ` AND cycle_id = ANY($${paramsCount}::int[])`;
                values.push(idArray);
                paramsCount++;
            }
        }
        if (artifact) {
            // artifact can be OO, Kit, etc.
            baseWhere += ` AND artifact ILIKE $${paramsCount}`;
            values.push(`%${artifact}%`);
            paramsCount++;
        }

        // Handle optional month filtering
        const expectedDateFilter = currentMonth
            ? `EXTRACT(YEAR FROM COALESCE(qualification_date, created_date)) = ${currentYear} AND EXTRACT(MONTH FROM COALESCE(qualification_date, created_date)) = ${currentMonth}`
            : `EXTRACT(YEAR FROM COALESCE(qualification_date, created_date)) = ${currentYear}`;

        const deliveryDateFilter = currentMonth
            ? `EXTRACT(YEAR FROM delivery_date) = ${currentYear} AND EXTRACT(MONTH FROM delivery_date) = ${currentMonth}`
            : `EXTRACT(YEAR FROM delivery_date) = ${currentYear}`;

        const cancelledDateFilter = currentMonth
            ? `EXTRACT(YEAR FROM COALESCE(delivery_date, created_date)) = ${currentYear} AND EXTRACT(MONTH FROM COALESCE(delivery_date, created_date)) = ${currentMonth}`
            : `EXTRACT(YEAR FROM COALESCE(delivery_date, created_date)) = ${currentYear}`;

        const queries = {
            // Existing ones + Em Tratativa
            backlogCount: `SELECT COUNT(*) FROM demands WHERE status NOT IN ('ENTREGUE', 'CANCELADA') AND ${baseWhere}`,
            emTratativa: `SELECT COUNT(*) FROM demands WHERE status NOT IN ('ENTREGUE', 'CANCELADA', 'PENDENTE TRIAGEM') AND ${baseWhere}`,

            // Monthly/Period Input
            entriesThisMonth: `SELECT COUNT(*) FROM demands WHERE ${expectedDateFilter} AND ${baseWhere}`,

            // Yearly Input
            entriesThisYear: `SELECT COUNT(*) FROM demands WHERE EXTRACT(YEAR FROM COALESCE(qualification_date, created_date)) = ${currentYear} AND ${baseWhere}`,

            // Monthly/Period Delivery (Qty, Value, SLA)
            deliveredThisMonth: `
                SELECT 
                    COUNT(*) as count, 
                    SUM(value::numeric) as total_value,
                    AVG(
                        EXTRACT(EPOCH FROM (COALESCE(delivery_date, NOW()) - COALESCE(qualification_date, created_date))) / 86400.0 - (COALESCE(frozen_time_minutes, 0) / 1440.0)
                    ) as avg_sla_days
                FROM demands 
                WHERE status = 'ENTREGUE' 
                AND ${deliveryDateFilter}
                AND ${baseWhere}
            `,

            // prioritizations on the specific month/period
            prioritizedThisMonth: `
                SELECT 
                    COUNT(*) as count
                FROM demands d
                WHERE status NOT IN ('ENTREGUE', 'CANCELADA') 
                AND weight IN (0, 1)
                AND ${expectedDateFilter.replace(/qualification_date/g, 'd.qualification_date').replace(/created_date/g, 'd.created_date')}
                AND ${baseWhere.replace(/cycle_id/g, 'd.cycle_id').replace(/artifact/g, 'd.artifact')}
            `,

            // Top Prioritized Clients in the month/period
            topPrioritizedClientsThisMonth: `
                SELECT c.name, COUNT(d.id) as count
                FROM demands d
                JOIN clients c ON d.client_id = c.id
                WHERE d.status NOT IN ('ENTREGUE', 'CANCELADA') 
                AND d.weight IN (0, 1)
                AND ${expectedDateFilter.replace(/qualification_date/g, 'd.qualification_date').replace(/created_date/g, 'd.created_date')}
                AND ${baseWhere.replace(/cycle_id/g, 'd.cycle_id').replace(/artifact/g, 'd.artifact')}
                GROUP BY c.id, c.name
                ORDER BY count DESC
            `,

            // Cancellations in the period
            cancelledThisMonth: `SELECT COUNT(*) FROM demands WHERE status = 'CANCELADA' AND ${cancelledDateFilter} AND ${baseWhere}`,
            cancelledThisYear: `SELECT COUNT(*) FROM demands WHERE status = 'CANCELADA' AND EXTRACT(YEAR FROM COALESCE(delivery_date, created_date)) = ${currentYear} AND ${baseWhere}`,

            // Yearly Delivery Total (Qty, Value, SLA)
            deliveredThisYear: `
                SELECT 
                    COUNT(*) as count,
                    SUM(value::numeric) as total_value,
                    AVG(
                        EXTRACT(EPOCH FROM (COALESCE(delivery_date, NOW()) - COALESCE(qualification_date, created_date))) / 86400.0 - (COALESCE(frozen_time_minutes, 0) / 1440.0)
                    ) as avg_sla_days,
                    COUNT(NULLIF(value::numeric, 0)) as valued_count
                FROM demands 
                WHERE status = 'ENTREGUE' 
                AND EXTRACT(YEAR FROM delivery_date) = ${currentYear}
                AND ${baseWhere}
            `,

            // Kept for backward compat with top clients view
            topClients: `
                SELECT c.name, COUNT(d.id) as count
                FROM demands d
                JOIN clients c ON d.client_id = c.id
                WHERE d.status NOT IN ('ENTREGUE', 'CANCELADA')
                AND ${baseWhere.replace(/cycle_id/g, 'd.cycle_id').replace(/artifact/g, 'd.artifact')}
                GROUP BY c.id, c.name
                ORDER BY count DESC
                LIMIT 5
            `,

            currentlyReopened: `
                SELECT d.id, d.product, d.client_id, d.delivery_date, c.name as client_name 
                FROM demands d 
                LEFT JOIN clients c ON d.client_id = c.id
                WHERE d.status = 'REABERTA'
                AND ${baseWhere.replace(/cycle_id/g, 'd.cycle_id').replace(/artifact/g, 'd.artifact')}
            `
        };

        const [
            backlogRes, emTratativaRes, entriesMonthRes, entriesYearRes,
            deliveredMonthRes, prioritizedMonthRes, topPrioritizedClientsRes,
            cancelledMonthRes, cancelledYearRes, deliveredYearRes, topClientsRes, reopenedRes
        ] = await Promise.all([
            client.query(queries.backlogCount, values),
            client.query(queries.emTratativa, values),
            client.query(queries.entriesThisMonth, values),
            client.query(queries.entriesThisYear, values),
            client.query(queries.deliveredThisMonth, values),
            client.query(queries.prioritizedThisMonth, values),
            client.query(queries.topPrioritizedClientsThisMonth, values),
            client.query(queries.cancelledThisMonth, values),
            client.query(queries.cancelledThisYear, values),
            client.query(queries.deliveredThisYear, values),
            client.query(queries.topClients, values),
            client.query(queries.currentlyReopened, values)
        ]);

        res.json({
            // Core
            backlog: parseInt(backlogRes.rows[0].count),
            emTratativa: parseInt(emTratativaRes.rows[0].count),

            // Entries
            entriesThisMonth: parseInt(entriesMonthRes.rows[0].count),
            entriesThisYear: parseInt(entriesYearRes.rows[0].count),

            // Deliveries in Month
            deliveredThisMonth: parseInt(deliveredMonthRes.rows[0].count),
            valueThisMonth: parseFloat(deliveredMonthRes.rows[0].total_value || 0),
            slaThisMonth: parseFloat(deliveredMonthRes.rows[0].avg_sla_days || 0),

            // Deliveries in Year
            deliveredThisYear: parseInt(deliveredYearRes.rows[0].count),
            valueThisYear: parseFloat(deliveredYearRes.rows[0].total_value || 0),
            slaThisYear: parseFloat(deliveredYearRes.rows[0].avg_sla_days || 0),
            valuedDemandsCount: parseInt(deliveredYearRes.rows[0].valued_count || 0),

            // Priority
            highPriorityThisMonth: parseInt(prioritizedMonthRes.rows[0].count),
            topPrioritizedClientsThisMonth: topPrioritizedClientsRes.rows.map(r => ({ name: r.name, count: parseInt(r.count) })),

            // Cancellation
            cancelledThisMonth: parseInt(cancelledMonthRes.rows[0].count),
            cancelledThisYear: parseInt(cancelledYearRes.rows[0].count),

            // Base UI blocks
            topClients: topClientsRes.rows.map(r => ({ name: r.name, count: parseInt(r.count) })),
            currentlyReopened: reopenedRes.rows
        });
    } catch (err) {
        console.error("Error fetching CDPC metrics:", err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

/**
 * GET /metrics/cocr
 * High-performance aggregation for COCR Dashboard
 */
router.get('/cocr', async (req, res) => {
    // Note: the time filters on COCR only filter the volumes (aditamentos e contratos renovados no mês).
    // The total pipeline/caixa values are global totals independent of the month filter unless specified by exact requirement.
    const client = await db.connect();
    try {
        const { month, year } = req.query;

        const rawYear = year ? parseInt(year, 10) : new Date().getFullYear();
        const rawMonth = month ? parseInt(month, 10) : null;

        const currentYear = rawYear;
        const currentMonth = rawMonth;

        // Mês atual é usado para aditamentos e relatórios de métrica. Usa created_at como proxy para data de referência se houver
        // Como o contrato tem status Ativo, as medições de volume no período geralmente não dependem fortemente da aba a nao ser por renovação
        const dateFilterAditamento = currentMonth
            ? `AND EXTRACT(YEAR FROM created_at) = ${currentYear} AND EXTRACT(MONTH FROM created_at) = ${currentMonth}`
            : `AND EXTRACT(YEAR FROM created_at) = ${currentYear}`;

        const dateFilterAssinatura = currentMonth
            ? `AND EXTRACT(YEAR FROM created_at) = ${currentYear} AND EXTRACT(MONTH FROM created_at) = ${currentMonth}`
            : `AND EXTRACT(YEAR FROM created_at) = ${currentYear}`;

        const queries = {
            totals: `SELECT COUNT(*) as total_count, SUM(valor_contrato) as global_value FROM contracts WHERE status ILIKE 'Ativo'`,
            aditamentos: `
                SELECT COUNT(*) as count, SUM(valor_aditamento) as total_value 
                FROM contracts 
                WHERE status ILIKE 'Ativo' 
                AND (
                    tipo_tratativa ILIKE '%adit%' OR 
                    etapa ILIKE '%adit%' OR 
                    (tipo_aditamento IS NOT NULL AND TRIM(tipo_aditamento) != '')
                )
                ${dateFilterAditamento}
            `,
            assinaturas: `
                SELECT COUNT(*) as count, SUM(valor_contrato) as total_value 
                FROM contracts 
                WHERE status ILIKE 'Ativo' 
                AND tipo_tratativa ILIKE '%prorroga%' 
                AND (etapa ILIKE '9.%' OR etapa ILIKE '9 %')
                ${dateFilterAssinatura}
            `,
            expiring: `
                SELECT contrato, cliente, termo, data_fim_efetividade, 
                EXTRACT(DAY FROM (data_fim_efetividade - NOW())) as days_left
                FROM contracts
                WHERE status ILIKE 'Ativo'
                AND data_fim_efetividade IS NOT NULL
                AND data_fim_efetividade <= NOW() + INTERVAL '90 days'
                ORDER BY data_fim_efetividade ASC
            `
        };

        const [totalsRes, aditamentosRes, assinaturasRes, expiringRes] = await Promise.all([
            client.query(queries.totals),
            client.query(queries.aditamentos),
            client.query(queries.assinaturas),
            client.query(queries.expiring)
        ]);

        const expiringContracts = expiringRes.rows.map(r => {
            const daysLeft = parseInt(r.days_left);
            let statusLabel = 'Monitoramento';
            let statusStyle = 'bg-slate-100 text-slate-700';
            if (daysLeft <= 0) {
                statusLabel = 'Vencido';
                statusStyle = 'bg-rose-600 text-white';
            } else if (daysLeft <= 30) {
                statusLabel = 'Urgente';
                statusStyle = 'bg-rose-500 text-white';
            } else if (daysLeft <= 60) {
                statusLabel = 'Atenção';
                statusStyle = 'bg-amber-500 text-white';
            }

            return {
                name: `${r.contrato} - ${r.cliente}`,
                daysLeft,
                statusLabel,
                statusStyle,
                term: r.termo
            };
        });

        res.json({
            totalContracts: parseInt(totalsRes.rows[0].total_count || 0),
            globalValue: parseFloat(totalsRes.rows[0].global_value || 0),
            aditamentosMonthCount: parseInt(aditamentosRes.rows[0].count || 0),
            aditamentosMonthValue: parseFloat(aditamentosRes.rows[0].total_value || 0),
            aguardandoAssinaturaCount: parseInt(assinaturasRes.rows[0].count || 0),
            aguardandoAssinaturaValue: parseFloat(assinaturasRes.rows[0].total_value || 0),
            expiringContracts
        });
    } catch (err) {
        console.error("Error fetching COCR metrics:", err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

module.exports = router;
