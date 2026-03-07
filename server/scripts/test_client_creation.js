const axios = require('axios');
const fs = require('fs');

async function testCreateClient() {
    try {
        const newClient = {
            name: `Test Client ${Date.now()}`,
            sigla: `TST${Math.floor(Math.random() * 1000)}`,
            active: true
        };

        console.log('Sending POST /clients:', newClient);

        const res = await axios.post('http://localhost:3000/clients', newClient);

        console.log('SUCCESS: Client created successfully.');
        console.log('Response:', JSON.stringify(res.data, null, 2));

    } catch (err) {
        console.error('FAILURE: Error occurred.');
        const errorLog = {
            message: err.message,
            status: err.response ? err.response.status : 'No Response',
            data: err.response ? err.response.data : 'No Data',
            stack: err.stack
        };
        fs.writeFileSync('client_creation_error.json', JSON.stringify(errorLog, null, 2));
        console.log('Error details written to client_creation_error.json');
    }
}

testCreateClient();
