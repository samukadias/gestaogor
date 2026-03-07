const bcrypt = require('bcryptjs');
const db = require('../db');

/**
 * Seed default users with bcrypt-hashed passwords.
 * Only creates if user doesn't already exist.
 */
const seedUsers = async () => {
    const users = [
        // GOR (Gerencia Geral)
        { name: 'Gerente Geral', email: 'gerente_gor@fluxo.com', password: '123', role: 'manager', department: 'GOR', allowed_modules: ['flow', 'finance', 'contracts'] },
        // COCR
        { name: 'Gestor COCR', email: 'gestor_cocr@fluxo.com', password: '123', role: 'manager', department: 'COCR', allowed_modules: ['contracts'] },
        { name: 'Analista COCR', email: 'analista_cocr@fluxo.com', password: '123', role: 'analyst', department: 'COCR', allowed_modules: ['contracts'] },
        { name: 'Cliente COCR', email: 'cliente_cocr@fluxo.com', password: '123', role: 'client', department: 'COCR', allowed_modules: ['contracts'] },
        // CDPC
        { name: 'Gestor CDPC', email: 'gestor_cdpc@fluxo.com', password: '123', role: 'manager', department: 'CDPC', allowed_modules: ['flow'] },
        { name: 'Analista CDPC', email: 'analista_cdpc@fluxo.com', password: '123', role: 'analyst', department: 'CDPC', allowed_modules: ['flow'] },
        { name: 'Solicitante CDPC', email: 'solicitante_cdpc@fluxo.com', password: '123', role: 'requester', department: 'CDPC', allowed_modules: ['flow'] },
        // CVAC
        { name: 'Gestor CVAC', email: 'gestor_cvac@fluxo.com', password: '123', role: 'manager', department: 'CVAC', allowed_modules: ['finance'] },
        { name: 'Analista CVAC', email: 'analista_cvac@fluxo.com', password: '123', role: 'analyst', department: 'CVAC', allowed_modules: ['finance'] },
        // Legacy
        { name: 'Gestor Fluxo', email: 'gestor@fluxo.com', password: '123', role: 'manager', department: 'GOR', allowed_modules: ['flow', 'finance', 'contracts'] },
    ];

    for (const user of users) {
        const exists = await db.query('SELECT id FROM users WHERE email = $1', [user.email]);
        if (exists.rows.length === 0) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            await db.query(
                'INSERT INTO users (name, email, password, role, department, allowed_modules) VALUES ($1, $2, $3, $4, $5, $6)',
                [user.name, user.email, hashedPassword, user.role, user.department, user.allowed_modules]
            );

            // Sync with domain tables
            if (user.role === 'analyst') {
                try {
                    await db.query('INSERT INTO analysts (name, email) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING', [user.name, user.email]);
                } catch (e) { /* ignore */ }
            }
            if (user.role === 'requester') {
                try {
                    await db.query('INSERT INTO requesters (name, email) VALUES ($1, $2)', [user.name, user.email]);
                } catch (e) { /* ignore */ }
            }
            if (user.role === 'client') {
                try {
                    await db.query('INSERT INTO clients (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [user.name]);
                } catch (e) { /* ignore */ }
            }
            console.log(`  Created user: ${user.name} (${user.department})`);
        }
    }
};

module.exports = seedUsers;
