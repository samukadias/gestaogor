const axios = require('axios');
const fs = require('fs');

(async () => {
    try {
        console.log('Testing GET /attestations?sort=-reference_month');
        const res = await axios.get('http://localhost:3000/attestations?sort=-reference_month');
        console.log('Success - Status:', res.status);
    } catch (e) {
        let errorInfo = `Status: ${e.response?.status}\n`;
        errorInfo += `Data: ${JSON.stringify(e.response?.data, null, 2)}\n`;
        fs.writeFileSync('api_error.log', errorInfo);
        console.log('Error logged to api_error.log');
    }
})();
