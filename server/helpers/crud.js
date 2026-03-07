const db = require('../db');

// Whitelist of allowed sort fields per table (SQL Injection Protection)
const ALLOWED_SORT_FIELDS = {
    demands: ['id', 'demand_number', 'product', 'status', 'artifact', 'complexity', 'created_date', 'qualification_date', 'expected_delivery_date', 'delivery_date', 'stage'],
    clients: ['id', 'name', 'sigla', 'created_at'],
    analysts: ['id', 'name', 'email', 'created_at'],
    users: ['id', 'name', 'email', 'role', 'department'],
    monthly_attestations: ['id', 'reference_month', 'client_name', 'pd_number', 'responsible_analyst', 'report_generation_date'],
    status_history: ['id', 'demand_id', 'changed_at', 'from_status', 'to_status'],
    stage_history: ['id', 'demand_id', 'stage', 'entered_at', 'exited_at', 'duration_minutes'],
    finance_contracts: ['id', 'client_name', 'pd_number', 'responsible_analyst', 'created_at'],
    archive_prazos_contracts: ['id', 'cliente', 'contrato', 'data_inicio_efetividade', 'data_fim_efetividade', 'status'],
    cycles: ['id', 'name'],
    requesters: ['id', 'name', 'email'],
    holidays: ['id', 'date', 'name'],
    attestations: ['id', 'reference_month', 'client_name', 'pd_number'],
    confirmation_terms: ['id', 'created_at', 'updated_at', 'numero_tc', 'contrato_associado_pd'],
    contracts: ['id', 'cliente', 'contrato', 'data_inicio_efetividade', 'data_fim_efetividade', 'status', 'created_at'],
    notifications: ['id', 'user_id', 'type', 'read', 'created_at'],
    activity_log: ['id', 'user_id', 'action', 'entity', 'created_at'],
};

// Whitelist of allowed filter columns per table (SQL Injection Protection)
const ALLOWED_FILTER_COLUMNS = {
    demands: ['id', 'demand_number', 'product', 'status', 'artifact', 'complexity', 'client_id', 'analyst_id', 'cycle_id', 'requester_id', 'stage', 'support_analyst_id'],
    clients: ['id', 'name', 'sigla', 'active'],
    analysts: ['id', 'name', 'email'],
    users: ['id', 'name', 'email', 'role', 'department', 'profile_type'],
    monthly_attestations: ['id', 'contract_id', 'reference_month', 'client_name', 'pd_number', 'responsible_analyst'],
    status_history: ['id', 'demand_id', 'from_status', 'to_status'],
    stage_history: ['id', 'demand_id', 'stage'],
    finance_contracts: ['id', 'client_name', 'pd_number', 'responsible_analyst', 'sei_process_number'],
    archive_prazos_contracts: ['id', 'analista_responsavel', 'cliente', 'contrato', 'status', 'status_vencimento', 'grupo_cliente'],
    cycles: ['id', 'name'],
    requesters: ['id', 'name', 'email'],
    holidays: ['id', 'name'],
    confirmation_terms: ['id', 'numero_tc', 'contrato_associado_pd'],
    contracts: ['id', 'cliente', 'contrato', 'status', 'client_name', 'responsible_analyst'],
    notifications: ['id', 'user_id', 'type', 'read', 'entity_type'],
    activity_log: ['id', 'user_id', 'action', 'entity', 'entity_id'],
};

// Whitelist of allowed write columns per table (Mass Assignment Protection)
const ALLOWED_WRITE_COLUMNS = {
    demands: ['product', 'demand_number', 'status', 'artifact', 'complexity', 'weight', 'client_id', 'analyst_id', 'cycle_id', 'requester_id', 'created_date', 'qualification_date', 'expected_delivery_date', 'delivery_date', 'observation', 'frozen_time_minutes', 'last_frozen_at', 'support_analyst_id', 'delivery_date_change_reason', 'contract_id', 'stage', 'value', 'architect_support_analyst_id', 'margem_bruta', 'margem_liquida'],
    clients: ['name', 'sigla', 'active'],
    analysts: ['name', 'email'],
    users: ['name', 'email', 'password', 'role', 'department', 'profile_type', 'allowed_modules', 'must_change_password'],
    monthly_attestations: ['contract_id', 'reference_month', 'client_name', 'pd_number', 'responsible_analyst', 'billed_amount', 'paid_amount', 'status', 'notes', 'observations',
        // Campos de datas do processo
        'report_generation_date', 'report_send_date', 'attestation_return_date', 'invoice_send_to_client_date', 'invoice_send_date',
        // Campos financeiros CVAC
        'measurement_value', 'esp_value',
        // NF-e
        'invoice_number', 'nfe_issue_date', 'nfe_sharepoint_date',
        // SEI e ESP
        'esp_number', 'sei_process_number', 'sei_send_area',
        // Gestor
        'gestor_email'
    ],
    status_history: ['demand_id', 'from_status', 'to_status', 'changed_by', 'changed_at', 'note'],
    stage_history: ['demand_id', 'stage', 'entered_at', 'exited_at', 'duration_minutes'],
    finance_contracts: ['client_name', 'pd_number', 'responsible_analyst', 'sei_process_number', 'start_date', 'end_date', 'total_value', 'notes',
        // Campos CVAC
        'esps', 'gestor_email',
        // Campos carregados automaticamente do COCR
        'cocr_contract_id', 'grupo_cliente', 'termo', 'objeto',
        'data_inicio_efetividade', 'data_fim_efetividade', 'status_vigencia'
    ],
    archive_prazos_contracts: ['analista_responsavel', 'cliente', 'grupo_cliente', 'contrato', 'termo', 'status', 'status_vencimento', 'data_inicio_efetividade', 'data_fim_efetividade', 'data_limite_andamento', 'valor_contrato', 'valor_faturado', 'valor_cancelado', 'valor_a_faturar', 'valor_novo_contrato', 'objeto', 'tipo_tratativa', 'tipo_aditamento', 'etapa', 'secao_responsavel', 'observacao', 'numero_processo_sei_nosso', 'numero_processo_sei_cliente', 'contrato_cliente', 'contrato_anterior', 'numero_pnpp_crm', 'sei', 'contrato_novo', 'termo_novo', 'created_by', 'margem_bruta', 'margem_liquida'],
    cycles: ['name'],
    requesters: ['name', 'email'],
    holidays: ['date', 'name', 'type'],
    confirmation_terms: ['numero_tc', 'contrato_associado_pd', 'valor_total'],
    contracts: ['analista_responsavel', 'cliente', 'grupo_cliente', 'contrato', 'termo', 'status', 'status_vencimento', 'data_inicio_efetividade', 'data_fim_efetividade', 'data_limite_andamento', 'valor_contrato', 'valor_faturado', 'valor_cancelado', 'valor_a_faturar', 'valor_novo_contrato', 'valor_aditamento', 'objeto', 'tipo_tratativa', 'tipo_aditamento', 'etapa', 'secao_responsavel', 'esps', 'observacao', 'numero_processo_sei_nosso', 'numero_processo_sei_cliente', 'contrato_cliente', 'contrato_anterior', 'numero_pnpp_crm', 'sei', 'contrato_novo', 'termo_novo', 'created_by', 'margem_bruta', 'margem_liquida'],
    notifications: ['user_id', 'type', 'message', 'entity_type', 'entity_id', 'read'],
    activity_log: ['user_id', 'action', 'entity', 'entity_id', 'changes'],
};

/**
 * Validation Middleware for pagination parameters
 */
const validatePagination = (req, res, next) => {
    const { page, limit } = req.query;

    if (page !== undefined) {
        const pageNum = parseInt(page);
        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({ error: 'Invalid page number.' });
        }
        if (pageNum > 10000) {
            return res.status(400).json({ error: 'Page number too large.' });
        }
        req.query.page = pageNum;
    }

    if (limit !== undefined) {
        const limitNum = parseInt(limit);
        if (isNaN(limitNum) || limitNum < 1) {
            return res.status(400).json({ error: 'Invalid limit.' });
        }
        if (limitNum > 1000) {
            return res.status(400).json({ error: 'Limit too large.' });
        }
        req.query.limit = limitNum;
    }

    next();
};

/**
 * Error Handler Utility - sanitizes errors in production
 */
const handleError = (err, res, context = 'Operation') => {
    console.error(`[ERROR ${context}]:`, err.message);
    const isDev = process.env.NODE_ENV !== 'production';
    const message = isDev ? err.message : `${context} failed`;
    res.status(500).json({
        error: message,
        ...(isDev && { stack: err.stack })
    });
};

/**
 * Helper function to create CRUD routes for a resource.
 * Includes SQL injection protection for sort and filter columns.
 */
const createCrudRoutes = (app, resource, tableName) => {
    const allowedSortFields = ALLOWED_SORT_FIELDS[tableName] || ALLOWED_SORT_FIELDS[resource] || [];
    const allowedFilterCols = ALLOWED_FILTER_COLUMNS[tableName] || ALLOWED_FILTER_COLUMNS[resource] || [];

    // List
    app.get(`/${resource}`, validatePagination, async (req, res) => {
        try {
            let { sort, page, limit, ...filters } = req.query;

            if (!sort && filters.sort) {
                sort = filters.sort;
                delete filters.sort;
            }

            let query = `SELECT * FROM ${tableName}`;
            let countQuery = `SELECT COUNT(*) FROM ${tableName}`;
            const values = [];
            const whereConditions = [];

            // Special logic for Demands
            if (tableName === 'demands') {
                if (filters.status === 'active') {
                    whereConditions.push(`status NOT IN ('ENTREGUE', 'CANCELADA')`);
                    delete filters.status;
                } else if (filters.status === 'all') {
                    delete filters.status;
                }

                if (filters.search) {
                    const searchParamIndex = values.length + 1;
                    whereConditions.push(`(product ILIKE $${searchParamIndex} OR demand_number ILIKE $${searchParamIndex})`);
                    values.push(`%${filters.search}%`);
                }
                delete filters.search;
            } else {
                if (filters.status === 'all') delete filters.status;
            }

            // Clean up 'all' filters
            Object.keys(filters).forEach(key => {
                if (filters[key] === 'all') delete filters[key];
            });

            // Generic filters with column validation
            Object.keys(filters).forEach((key) => {
                const baseKey = key.endsWith('_like') ? key.replace('_like', '') : key;

                // SQL Injection Protection: validate column name
                if (!allowedFilterCols.includes(baseKey)) {
                    return; // skip unknown columns silently
                }

                const paramIndex = values.length + 1;
                if (key.endsWith('_like')) {
                    whereConditions.push(`${baseKey} ILIKE $${paramIndex}`);
                    values.push(`%${filters[key]}%`);
                } else {
                    whereConditions.push(`${baseKey} = $${paramIndex}`);
                    values.push(filters[key]);
                }
            });

            if (whereConditions.length > 0) {
                const whereClause = ` WHERE ${whereConditions.join(' AND ')}`;
                query += whereClause;
                countQuery += whereClause;
            }

            if (sort) {
                const direction = sort.startsWith('-') ? 'DESC' : 'ASC';
                const field = sort.startsWith('-') ? sort.substring(1) : sort;

                if (!allowedSortFields.includes(field)) {
                    return res.status(400).json({
                        error: `Invalid sort field: "${field}". Allowed: ${allowedSortFields.join(', ')}`
                    });
                }
                query += ` ORDER BY ${field} ${direction}`;
            }

            // Pagination
            if (page && limit) {
                const limitVal = parseInt(limit);
                const offsetVal = (parseInt(page) - 1) * limitVal;
                query += ` LIMIT ${limitVal} OFFSET ${offsetVal}`;
            }

            if (page && limit) {
                const countResult = await db.query(countQuery, values);
                const totalCount = parseInt(countResult.rows[0].count);
                res.setHeader('X-Total-Count', totalCount);
            }

            const result = await db.query(query, values);
            res.json(result.rows);
        } catch (err) {
            handleError(err, res, `List ${resource}`);
        }
    });

    // Get one
    app.get(`/${resource}/:id`, async (req, res) => {
        try {
            const result = await db.query(`SELECT * FROM ${tableName} WHERE id = $1`, [req.params.id]);
            if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
            res.json(result.rows[0]);
        } catch (err) {
            handleError(err, res, `Get ${resource}`);
        }
    });

    // Create
    app.post(`/${resource}`, async (req, res) => {
        try {
            const allowedWriteCols = ALLOWED_WRITE_COLUMNS[tableName] || ALLOWED_WRITE_COLUMNS[resource];
            let body = { ...req.body };

            // Mass Assignment Protection: strip fields not in whitelist
            if (allowedWriteCols) {
                Object.keys(body).forEach(key => {
                    if (!allowedWriteCols.includes(key)) {
                        delete body[key];
                    }
                });
            }

            Object.keys(body).forEach(key => {
                if (body[key] === '') body[key] = null;
            });

            const keys = Object.keys(body);
            if (keys.length === 0) return res.status(400).json({ error: 'No valid fields to insert.' });

            const values = Object.values(body);
            const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
            const query = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;

            const result = await db.query(query, values);
            res.status(201).json(result.rows[0]);
        } catch (err) {
            handleError(err, res, `Create ${resource}`);
        }
    });

    // Update
    app.put(`/${resource}/:id`, async (req, res) => {
        try {
            const allowedWriteCols = ALLOWED_WRITE_COLUMNS[tableName] || ALLOWED_WRITE_COLUMNS[resource];
            let body = { ...req.body };

            // Mass Assignment Protection: strip fields not in whitelist
            if (allowedWriteCols) {
                Object.keys(body).forEach(key => {
                    if (!allowedWriteCols.includes(key)) {
                        delete body[key];
                    }
                });
            }

            Object.keys(body).forEach(key => {
                if (body[key] === '') body[key] = null;
            });

            // If updating a user and a password is provided, hash it
            if (tableName === 'users' && body.password) {
                const bcrypt = require('bcryptjs');
                body.password = await bcrypt.hash(body.password, 10);
            }

            const keys = Object.keys(body);
            const values = Object.values(body);

            if (keys.length === 0) return res.status(400).json({ error: 'No fields to update' });

            const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
            const query = `UPDATE ${tableName} SET ${setClause} WHERE id = $1 RETURNING *`;

            const result = await db.query(query, [req.params.id, ...values]);
            if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
            res.json(result.rows[0]);
        } catch (err) {
            handleError(err, res, `Update ${resource}`);
        }
    });

    // Delete (with cascade for related records)
    app.delete(`/${resource}/:id`, async (req, res) => {
        try {
            // Cascade delete: remove related records first
            if (tableName === 'finance_contracts') {
                await db.query(`DELETE FROM monthly_attestations WHERE contract_id = $1`, [req.params.id]);
            }

            const result = await db.query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING *`, [req.params.id]);
            if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
            res.json({ message: 'Deleted successfully' });
        } catch (err) {
            handleError(err, res, `Delete ${resource}`);
        }
    });
};

module.exports = { createCrudRoutes, validatePagination, handleError, ALLOWED_SORT_FIELDS, ALLOWED_FILTER_COLUMNS, ALLOWED_WRITE_COLUMNS };
