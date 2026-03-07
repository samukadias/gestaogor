const axios = require('axios');

async function testStageHistory() {
    try {
        console.log('Testing /stage_history ...');
        // Assuming localhost:3000
        const res = await axios.get('http://localhost:3000/stage_history');
        console.log('Status:', res.status);
        console.log('Count:', res.data.length);
        if (res.data.length > 0) {
            console.log('Sample item:', res.data[0]);
        } else {
            console.log('No data returned.');
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

testStageHistory();
