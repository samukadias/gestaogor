const axios = require('axios');
const baseURL = 'http://localhost:3000';

const email = 'gestor@fluxo.com';
const password = '123';

async function testDemands() {
    try {
        console.log('Logging in...');
        // Login first to check connectivity
        await axios.post(`${baseURL}/auth/login`, { email, password });
        console.log('Login OK.');

        console.log('Fetching Demands...');
        const res = await axios.get(`${baseURL}/demands`);
        console.log(`Status: ${res.status}`);
        console.log(`Count: ${res.data.length}`);

        if (res.data.length > 0) {
            console.log('First Demand Sample:', JSON.stringify(res.data[0], null, 2));
        } else {
            console.log('No demands returned from API.');
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.log('Response Data:', error.response.data);
        }
    }
}

testDemands();
