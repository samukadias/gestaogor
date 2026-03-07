
// Módulo Financeiro - Rotas e Controllers
const express = require('express');
const router = express.Router();
const db = require('../../../db'); // Importa o DB centralizado

// Exemplo: Listar Faturas de um Contrato
router.get('/contracts/:contractId/invoices', async (req, res) => {
    try {
        const { contractId } = req.params;
        const result = await db.query('SELECT * FROM invoices WHERE contract_id = $1', [contractId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Adicione aqui as outras rotas do seu sistema financeiro (ex: criar fatura, atualizar saldo)

module.exports = router;
