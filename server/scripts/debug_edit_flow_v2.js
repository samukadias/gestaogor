const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function run() {
    console.log('--- Debugging EditContract Flow V2 (With Sort) ---');
    try {
        // 4. TCs with Sort
        console.log('4. Fetching TCs with sort=-created_at...');
        const resTCs = await axios.get(`${BASE_URL}/termos_confirmacao?sort=-created_at`);
        console.log('   Status:', resTCs.status);
        console.log('   Count:', resTCs.data.length);

        console.log('--- ALL SUCCESS ---');
    } catch (error) {
        console.error('--- FAILURE ---');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
            console.error('URL:', error.config.url);
        } else {
            console.error('Error:', error.message);
        }
    }
}

run();
