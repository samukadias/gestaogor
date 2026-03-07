const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function run() {
    console.log('--- Debugging EditContract Flow ---');
    try {
        // 1. Contract
        console.log('1. Fetching Contract 3...');
        const resContract = await axios.get(`${BASE_URL}/deadline_contracts/3`);
        console.log('   Status:', resContract.status);
        console.log('   Data:', JSON.stringify(resContract.data).substring(0, 100) + '...');

        // 2. Users
        console.log('2. Fetching Users...');
        const resUsers = await axios.get(`${BASE_URL}/users`);
        console.log('   Status:', resUsers.status);
        console.log('   Count:', resUsers.data.length);

        // 3. Me
        console.log('3. Fetching Me...');
        const resMe = await axios.get(`${BASE_URL}/auth/me`);
        console.log('   Status:', resMe.status);
        console.log('   Data:', resMe.data);

        // 4. TCs
        console.log('4. Fetching TCs...');
        const resTCs = await axios.get(`${BASE_URL}/termos_confirmacao`);
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
