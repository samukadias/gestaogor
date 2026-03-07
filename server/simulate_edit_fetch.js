const axios = require('axios');

async function testFetch() {
    try {
        console.log('Simulating EditContract data fetching...');
        const baseUrl = 'http://localhost:3000';
        const contractId = 3;

        console.log(`1. Fetching Contract ${contractId}...`);
        const contract = await axios.get(`${baseUrl}/deadline_contracts/${contractId}`);
        console.log('Contract OK');

        console.log('2. Fetching Users...');
        const users = await axios.get(`${baseUrl}/users`);
        console.log(`Users OK (${users.data.length} found)`);

        console.log('3. Fetching User Me (mocked/auth)...');
        // Note: 'Me' endpoint requires auth, but for now we check if endpoint exists or 401s
        try {
            await axios.get(`${baseUrl}/auth/me`);
            console.log('Auth Me OK');
        } catch (e) {
            console.log('Auth Me result:', e.response ? e.response.status : e.message);
        }

        console.log('4. Fetching TermoConfirmacao...');
        const terms = await axios.get(`${baseUrl}/termos_confirmacao`); // This is the route I added
        console.log(`Terms OK (${terms.data.length} found)`);

    } catch (e) {
        console.error('FETCH FAILED!');
        if (e.response) {
            console.error(`Status: ${e.response.status}`);
            console.error('Data:', e.response.data);
            console.error('URL:', e.config.url);
        } else {
            console.error(e.message);
        }
    }
}

testFetch();
