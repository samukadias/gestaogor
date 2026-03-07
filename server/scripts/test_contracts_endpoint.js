const axios = require('axios');

async function test() {
    try {
        console.log('Testing /contracts/3 ...');
        const res = await axios.get('http://localhost:3000/contracts/3');
        console.log('Status:', res.status);
        console.log('Data ID:', res.data.id);
        console.log('Data Contract:', res.data.contrato);
    } catch (e) {
        console.error('Error:', e.message);
        if (e.response) {
            console.error('Response Status:', e.response.status);
            console.error('Response Data:', e.response.data);
        }
    }
}

test();
