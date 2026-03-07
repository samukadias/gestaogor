const axios = require('axios');

async function testCreate() {
    try {
        console.log('Testing Contract Creation via API...');
        const url = 'http://localhost:3000/deadline_contracts';

        const payload = {
            contrato: 'TEST-AUTO-' + Date.now(),
            cliente: 'Cliente Teste',
            analista_responsavel: 'Analista Teste',
            valor_contrato: 1000.00,
            status: 'Ativo',
            data_inicio_efetividade: new Date().toISOString(),
            data_fim_efetividade: new Date().toISOString()
        };

        const res = await axios.post(url, payload);
        console.log('Create Success! ID:', res.data.id);

        // Clean up
        await axios.delete(url + '/' + res.data.id);
        console.log('Cleanup Success!');

    } catch (e) {
        if (e.response) {
            console.error('API Error:', e.response.status, e.response.data);
        } else {
            console.error('Connection Error:', e.message);
        }
    }
}

testCreate();
