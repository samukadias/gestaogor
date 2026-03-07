const express = require('express');
const db = require('../db');
const { handleError } = require('../helpers/crud');

const router = express.Router();

// ============================================================
// HELPER: verifica se usuário tem papel de gestor ou superior
// ============================================================
const isManager = (user) =>
    user && ['manager', 'admin', 'gestor'].includes(user.role);

// ============================================================
// MOTIVOS DE REABERTURA — CRUD (gestor+)
// ============================================================

/**
 * GET /reopening-reasons
 * Lista motivos ativos (todos os papéis)
 */
router.get('/reopening-reasons', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT * FROM demand_reopening_reasons WHERE active = TRUE ORDER BY label ASC`
        );
        res.json(result.rows);
    } catch (err) {
        handleError(err, res, 'List reopening reasons');
    }
});

/**
 * GET /reopening-reasons/all
 * Lista todos os motivos incluindo inativos (gestor+)
 */
router.get('/reopening-reasons/all', async (req, res) => {
    if (!isManager(req.user)) {
        return res.status(403).json({ error: 'Acesso negado. Apenas gestores podem gerenciar motivos.' });
    }
    try {
        const result = await db.query(
            `SELECT * FROM demand_reopening_reasons ORDER BY active DESC, label ASC`
        );
        res.json(result.rows);
    } catch (err) {
        handleError(err, res, 'List all reopening reasons');
    }
});

/**
 * POST /reopening-reasons
 * Cria novo motivo (gestor+)
 */
router.post('/reopening-reasons', async (req, res) => {
    if (!isManager(req.user)) {
        return res.status(403).json({ error: 'Acesso negado. Apenas gestores podem criar motivos.' });
    }
    const { label } = req.body;
    if (!label || !label.trim()) {
        return res.status(400).json({ error: 'O campo "label" é obrigatório.' });
    }
    try {
        const result = await db.query(
            `INSERT INTO demand_reopening_reasons (label, created_by) VALUES ($1, $2) RETURNING *`,
            [label.trim(), req.user.name || req.user.email]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        handleError(err, res, 'Create reopening reason');
    }
});

/**
 * PUT /reopening-reasons/:id
 * Edita motivo (gestor+)
 */
router.put('/reopening-reasons/:id', async (req, res) => {
    if (!isManager(req.user)) {
        return res.status(403).json({ error: 'Acesso negado.' });
    }
    const { label, active } = req.body;
    try {
        const fields = [];
        const values = [];
        let idx = 1;
        if (label !== undefined) { fields.push(`label = $${idx++}`); values.push(label.trim()); }
        if (active !== undefined) { fields.push(`active = $${idx++}`); values.push(active); }
        if (fields.length === 0) return res.status(400).json({ error: 'No fields to update.' });

        values.push(req.params.id);
        const result = await db.query(
            `UPDATE demand_reopening_reasons SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
            values
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Motivo não encontrado.' });
        res.json(result.rows[0]);
    } catch (err) {
        handleError(err, res, 'Update reopening reason');
    }
});

/**
 * DELETE /reopening-reasons/:id
 * Desativa motivo (soft delete) (gestor+)
 */
router.delete('/reopening-reasons/:id', async (req, res) => {
    if (!isManager(req.user)) {
        return res.status(403).json({ error: 'Acesso negado.' });
    }
    try {
        const result = await db.query(
            `UPDATE demand_reopening_reasons SET active = FALSE WHERE id = $1 RETURNING *`,
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Motivo não encontrado.' });
        res.json({ message: 'Motivo desativado com sucesso.' });
    } catch (err) {
        handleError(err, res, 'Deactivate reopening reason');
    }
});

// ============================================================
// REABERTURAS POR DEMANDA
// ============================================================

/**
 * GET /demands/:id/reopenings
 * Lista todas as reaberturas de uma demanda
 */
router.get('/:id/reopenings', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT * FROM demand_reopenings WHERE demand_id = $1 ORDER BY reopened_at ASC`,
            [req.params.id]
        );
        res.json(result.rows);
    } catch (err) {
        handleError(err, res, 'List demand reopenings');
    }
});

/**
 * POST /demands/:id/reopen
 * Reabre uma demanda entregue (gestor+)
 * Body: { reason_id, detail }
 */
router.post('/:id/reopen', async (req, res) => {
    if (!isManager(req.user)) {
        return res.status(403).json({ error: 'Acesso negado. Apenas gestores podem reabrir demandas.' });
    }

    const { reason_id, detail } = req.body;
    if (!reason_id) {
        return res.status(400).json({ error: 'O motivo de reabertura é obrigatório.' });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Verifica estado atual da demanda
        const demandRes = await client.query('SELECT id, status FROM demands WHERE id = $1', [req.params.id]);
        if (demandRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Demanda não encontrada.' });
        }

        const demand = demandRes.rows[0];
        if (demand.status !== 'ENTREGUE') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: `Só é possível reabrir demandas com status ENTREGUE. Status atual: ${demand.status}` });
        }

        // Busca o label do motivo
        const reasonRes = await client.query('SELECT label FROM demand_reopening_reasons WHERE id = $1', [reason_id]);
        const reasonLabel = reasonRes.rows[0]?.label || 'Motivo não encontrado';

        const now = new Date();
        const changedBy = req.user.name || req.user.email;

        // Registra a reabertura
        const reopeningRes = await client.query(`
            INSERT INTO demand_reopenings
                (demand_id, reason_id, reason_label, detail, reopened_at, reopened_by_id, reopened_by_name)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [req.params.id, reason_id, reasonLabel, detail || null, now, req.user.id, changedBy]);

        // Atualiza status da demanda
        await client.query(
            `UPDATE demands SET status = 'REABERTA' WHERE id = $1`,
            [req.params.id]
        );

        // Registra no histórico de status
        const lastHistoryRes = await client.query(
            'SELECT changed_at FROM status_history WHERE demand_id = $1 ORDER BY changed_at DESC LIMIT 1',
            [req.params.id]
        );
        let timeInPrev = null;
        if (lastHistoryRes.rows.length > 0) {
            timeInPrev = Math.round((now - new Date(lastHistoryRes.rows[0].changed_at)) / 60000);
        }

        await client.query(`
            INSERT INTO status_history (demand_id, from_status, to_status, changed_at, time_in_previous_status_minutes, changed_by)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [req.params.id, 'ENTREGUE', 'REABERTA', now, timeInPrev, changedBy]);

        await client.query('COMMIT');
        res.status(201).json(reopeningRes.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        handleError(err, res, 'Reopen demand');
    } finally {
        client.release();
    }
});

/**
 * POST /demands/:id/redeliver
 * Re-entrega uma demanda reaberta (analista+)
 */
router.post('/:id/redeliver', async (req, res) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Verifica estado atual
        const demandRes = await client.query('SELECT id, status FROM demands WHERE id = $1', [req.params.id]);
        if (demandRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Demanda não encontrada.' });
        }

        const demand = demandRes.rows[0];
        if (demand.status !== 'REABERTA') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: `Só é possível re-entregar demandas com status REABERTA. Status atual: ${demand.status}` });
        }

        const now = new Date();
        const changedBy = req.user.name || req.user.email;

        // Fecha o registro de reabertura mais recente
        await client.query(`
            UPDATE demand_reopenings
            SET redelivered_at = $1, redelivered_by_name = $2
            WHERE demand_id = $3 AND redelivered_at IS NULL
        `, [now, changedBy, req.params.id]);

        // Atualiza status e delivery_date da demanda
        await client.query(
            `UPDATE demands SET status = 'ENTREGUE', delivery_date = $1 WHERE id = $2`,
            [now, req.params.id]
        );

        // Registra no histórico de status
        const lastHistoryRes = await client.query(
            'SELECT changed_at FROM status_history WHERE demand_id = $1 ORDER BY changed_at DESC LIMIT 1',
            [req.params.id]
        );
        let timeInPrev = null;
        if (lastHistoryRes.rows.length > 0) {
            timeInPrev = Math.round((now - new Date(lastHistoryRes.rows[0].changed_at)) / 60000);
        }

        await client.query(`
            INSERT INTO status_history (demand_id, from_status, to_status, changed_at, time_in_previous_status_minutes, changed_by)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [req.params.id, 'REABERTA', 'ENTREGUE', now, timeInPrev, changedBy]);

        await client.query('COMMIT');
        res.json({ message: 'Demanda re-entregue com sucesso.', redelivered_at: now });
    } catch (err) {
        await client.query('ROLLBACK');
        handleError(err, res, 'Redeliver demand');
    } finally {
        client.release();
    }
});

module.exports = router;
