
// Módulo de Prazos - Rotas e Controllers
const express = require('express');
const router = express.Router();
const db = require('../../../db');

// Exemplo: Verificar Contratos perto de vencer
router.get('/contracts/expiring', async (req, res) => {
    try {
        // Lógica que você trairia do sistema de prazos
        const result = await db.query(`
            SELECT * FROM contracts 
            WHERE end_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
