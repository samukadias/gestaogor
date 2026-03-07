const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: '127.0.0.1', database: 'fluxo_prod', password: 'postgres', port: 5432 });

const dictionary = {
    'LIG??NCIA': 'LIGÊNCIA',
    'RETEN????O': 'RETENÇÃO',
    'SER??': 'SERÁ',
    'PEND??NCIA': 'PENDÊNCIA',
    'SERVI??O': 'SERVIÇO',
    'SUBSTITU??DO': 'SUBSTITUÍDO',
    'NEG??CIO': 'NEGÓCIO',
    'PR??-': 'PRÉ-',
    'VE??CULO': 'VEÍCULO',
    'CONTRATA??O': 'CONTRATAÇÃO',
    'TECNOL??GIC': 'TECNOLÓGIC',
    'F??SICO': 'FÍSICO',
    'ESCRIT??RIO': 'ESCRITÓRIO',
    'PR??PRIO': 'PRÓPRIO',
    'PR??PRIA': 'PRÓPRIA',
    'REUNI??O': 'REUNIÃO',
    'RELAT??RIO': 'RELATÓRIO',
    'N??MERO': 'NÚMERO',
    'SEGURAN??A': 'SEGURANÇA',
    'COMPUTA????O': 'COMPUTAÇÃO',
    'CONDI????ES': 'CONDIÇÕES',
    'RESID??NCIA': 'RESIDÊNCIA',
    'LICITA????O': 'LICITAÇÃO',
    'OR??AMENTO': 'ORÇAMENTO',
    'LICEN??AS': 'LICENÇAS',
    'AQUISI????O': 'AQUISIÇÃO',
    'AQUISI??AO': 'AQUISIÇÃO',
    'GEST??O': 'GESTÃO',
    'CONCESS??O': 'CONCESSÃO',
    'MANUTEN????O': 'MANUTENÇÃO',
    'SERVI??OS': 'SERVIÇOS',
    'PRESTA????O': 'PRESTAÇÃO',
    'SOLU????O': 'SOLUÇÃO',
    'SOLUCOES': 'SOLUÇÕES',
    'SOLU????ES': 'SOLUÇÕES',
    'IMPLANTA????O': 'IMPLANTAÇÃO',
    'COMUNICA????O': 'COMUNICAÇÃO',
    'LOCA????O': 'LOCAÇÃO',
    'N??CLEO': 'NÚCLEO',
    'NUCLEO': 'NÚCLEO',
    'PATRIM??NIO': 'PATRIMÔNIO',
    'INFORMA????O': 'INFORMAÇÃO',
    'F??CIL': 'FÁCIL',
    'M??DULO': 'MÓDULO',
    'RENOVA????O': 'RENOVAÇÃO',
    'SANCIONAT??RIO': 'SANCIONATÓRIO',
    'SUSTENTA????O': 'SUSTENTAÇÃO',
    'ATUALIZA????O': 'ATUALIZAÇÃO',
    'PRODU????O': 'PRODUÇÃO',
    'INTEGRA????O': 'INTEGRAÇÃO',
    'CESS??O': 'CESSÃO',
    'S??S': 'S/S',
    'S??O PAULO': 'SÃO PAULO',
    'INFORMA????ES': 'INFORMAÇÕES',
    'SISTEMAS': 'SISTEMAS',
    'INSTALA????O': 'INSTALAÇÃO',
    'SUBSCRI????O': 'SUBSCRIÇÃO',
    'CONTRATA????O': 'CONTRATAÇÃO',
    'PREVEN????O': 'PREVENÇÃO',
    'T??CNICO': 'TÉCNICO',
    'T??CNICA': 'TÉCNICA',
    'M??QUINA': 'MÁQUINA',
    'ELETR??NICO': 'ELETRÔNICO',
    'ELETR??NICA': 'ELETRÔNICA',
    'MONITORA????O': 'MONITORAÇÃO',
    'AN??LISE': 'ANÁLISE',
    'CONSTRU????O': 'CONSTRUÇÃO',
    'ADMINISTRA????O': 'ADMINISTRAÇÃO',
    'AVALIA????O': 'AVALIAÇÃO',
    'VERIFICA????O': 'VERIFICAÇÃO',
    'CRIA????O': 'CRIAÇÃO',
    'INSPE????O': 'INSPEÇÃO',
    'PROTE????O': 'PROTEÇÃO',
    'M??DIA': 'MÍDIA',
    'P??BLICO': 'PÚBLICO',
    'P??BLICA': 'PÚBLICA',
    'USU??RIO': 'USUÁRIO',
    'USU??RIOS': 'USUÁRIOS',
    'ÓRG??O': 'ÓRGÃO',
    'V??DEO': 'VÍDEO',
    'SA??DE': 'SAÚDE',
    'A????O': 'AÇÃO',
    'A????ES': 'AÇÕES',
    'SUBSTITUI????O': 'SUBSTITUIÇÃO',
    'OPERA????O': 'OPERAÇÃO',
    'OPERA????ES': 'OPERAÇÕES',
    'EXECU????O': 'EXECUÇÃO',
    'N??O': 'NÃO',
    'S??O': 'SÃO',
    'FAR??': 'FARÁ',
    'ENCERRAR??O': 'ENCERRARÃO',
    'RESCIS??O': 'RESCISÃO',
    'COMIT??': 'COMITÊ',
    'A??': 'ÃO',
    'APRESENTA????O': 'APRESENTAÇÃO',
    'PROJETC????O': 'PROJEÇÃO', // Usually doesn't happen, but just in case
    'F??RUM': 'FÓRUM'
};

function fixString(str) {
    if (!str || typeof str !== 'string' || !str.includes('??')) return str;
    let fixed = str;
    for (const [bad, good] of Object.entries(dictionary)) {
        const escapedBad = bad.replace(/\?/g, '\\?');
        const re = new RegExp(escapedBad, 'gi');
        fixed = fixed.replace(re, function (match) {
            if (match === match.toUpperCase()) return good;
            return good.charAt(0) + good.slice(1).toLowerCase();
        });
    }
    return fixed;
}

async function run() {
    try {
        const tables = ['contracts', 'finance_contracts', 'deadline_contracts', 'clients', 'analysts', 'demands', 'users', 'status_history', 'stage_history'];
        let totalFixes = 0;

        for (let t of tables) {
            const res = await pool.query(`SELECT * FROM ${t}`);
            for (let r of res.rows) {
                let updates = {};
                for (let [k, v] of Object.entries(r)) {
                    if (typeof v === 'string' && v.includes('??')) {
                        const fixed = fixString(v);
                        if (fixed !== v) {
                            updates[k] = fixed;
                        }
                    }
                }

                if (Object.keys(updates).length > 0) {
                    const idCol = r.id ? 'id' : (r.demand_id ? 'demand_id' : null);
                    if (idCol) {
                        const setClause = Object.keys(updates).map((k, i) => `"${k}" = $${i + 2}`).join(', ');
                        const values = [r[idCol], ...Object.values(updates)];
                        console.log(`Fixing ${t} [${idCol}=${r[idCol]}]:`, updates);
                        await pool.query(`UPDATE ${t} SET ${setClause} WHERE "${idCol}" = $1`, values);
                        totalFixes++;
                    }
                }
            }
        }
        console.log(`Done! Fixed ${totalFixes} rows.`);
    } catch (e) { console.error(e) }
    finally {
        pool.end();
    }
}
run();
