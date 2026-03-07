#!/usr/bin/env node

/**
 * Script de Migração: Supabase → Gestão GOR
 * 
 * Exporta contratos COCR do Supabase e importa no sistema local.
 * 
 * Uso:
 *   node migrate-supabase.js
 * 
 * Você precisará fornecer:
 * - URL do Supabase (ex: https://xyzcompany.supabase.co)
 * - Chave da API (anon key ou service_role key)
 * - Nome da tabela de contratos (ex: contracts_cocr)
 */

const https = require('https');
const http = require('http');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function fetchFromSupabase(url, apiKey, tableName) {
    return new Promise((resolve, reject) => {
        const fullUrl = `${url}/rest/v1/${tableName}?select=*`;
        const parsedUrl = new URL(fullUrl);

        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'GET',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        };

        const protocol = parsedUrl.protocol === 'https:' ? https : http;

        const req = protocol.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => { data += chunk; });

            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error('Erro ao parsear JSON: ' + e.message));
                    }
                } else {
                    reject(new Error(`Erro ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.end();
    });
}

async function importToFluxo(contracts) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/contracts',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        let imported = 0;
        let errors = 0;

        const importNext = async (index) => {
            if (index >= contracts.length) {
                console.log(`\n✅ Importação concluída!`);
                console.log(`   - Importados: ${imported}`);
                console.log(`   - Erros: ${errors}`);
                resolve({ imported, errors });
                return;
            }

            const contract = contracts[index];

            // Mapear campos do Supabase para o novo sistema
            const mapped = {
                contract_number: contract.contract_number || contract.numero_contrato || `CTR-${Date.now()}-${index}`,
                termo: contract.termo || contract.aditivo || '',
                object: contract.object || contract.objeto || '',
                company_name: contract.company_name || contract.empresa || contract.contratada || '',
                cliente: contract.cliente || contract.company_name || '',
                analista_responsavel: contract.analista_responsavel || contract.fiscal || contract.gestor || '',

                total_value: parseFloat(contract.total_value || contract.valor_total || contract.valor_contrato || 0),
                valor_contrato: parseFloat(contract.valor_contrato || contract.total_value || 0),
                valor_faturado: parseFloat(contract.valor_faturado || contract.executado || 0),
                valor_a_faturar: parseFloat(contract.valor_a_faturar || contract.saldo || 0),
                current_balance: parseFloat(contract.current_balance || contract.saldo || contract.valor_a_faturar || 0),

                start_date: contract.start_date || contract.data_inicio || contract.vigencia_inicio || null,
                end_date: contract.end_date || contract.data_fim || contract.vigencia_fim || null,
                data_inicio_efetividade: contract.data_inicio_efetividade || contract.start_date || null,
                data_fim_efetividade: contract.data_fim_efetividade || contract.end_date || null,

                numero_processo_sei_nosso: contract.numero_processo_sei_nosso || contract.processo_sei || '',
                status: contract.status || 'active'
            };

            const postData = JSON.stringify(mapped);

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });

                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        imported++;
                        process.stdout.write(`\r[${index + 1}/${contracts.length}] Importando: ${mapped.contract_number}`);
                    } else {
                        errors++;
                        console.log(`\n❌ Erro ao importar ${mapped.contract_number}: ${data}`);
                    }
                    setTimeout(() => importNext(index + 1), 100); // Delay para não sobrecarregar
                });
            });

            req.on('error', (e) => {
                errors++;
                console.log(`\n❌ Erro de rede ao importar ${mapped.contract_number}: ${e.message}`);
                setTimeout(() => importNext(index + 1), 100);
            });

            req.write(postData);
            req.end();
        };

        importNext(0);
    });
}

async function main() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║   MIGRAÇÃO SUPABASE → GESTÃO GOR (Contratos COCR)      ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    try {
        // Coletar credenciais
        const supabaseUrl = await question('🔗 URL do Supabase (ex: https://abc.supabase.co): ');
        const apiKey = await question('🔑 API Key do Supabase: ');
        const tableName = await question('📋 Nome da tabela (pressione Enter para usar "contracts_cocr"): ') || 'contracts_cocr';

        console.log('\n📡 Conectando ao Supabase...');

        // Buscar dados
        const contracts = await fetchFromSupabase(supabaseUrl.trim(), apiKey.trim(), tableName.trim());

        console.log(`✅ Encontrados ${contracts.length} contratos no Supabase.\n`);

        if (contracts.length === 0) {
            console.log('⚠️  Nenhum contrato encontrado. Verifique o nome da tabela.');
            rl.close();
            return;
        }

        // Confirmar importação
        const confirm = await question(`\n❓ Deseja importar ${contracts.length} contratos para o Gestão GOR? (s/n): `);

        if (confirm.toLowerCase() !== 's') {
            console.log('❌ Importação cancelada.');
            rl.close();
            return;
        }

        console.log('\n📥 Iniciando importação...\n');

        // Importar
        await importToFluxo(contracts);

    } catch (error) {
        console.error('\n❌ Erro durante a migração:', error.message);
        console.error('\nDetalhes:', error);
    } finally {
        rl.close();
    }
}

main();
