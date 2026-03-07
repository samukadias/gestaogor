const axios = require('axios');

const check = async () => {
    try {
        const res = await axios.get('http://localhost:3000/deadline_contracts?limit=5');
        console.log('API Status:', res.status);
        console.log('API Data Length:', res.data.length);
        console.log('API Sample:', res.data[0]);
    } catch (e) {
        console.error('API Error:', e.message);
        if (e.response) console.error('Response Data:', e.response.data);
    }
};

check();
