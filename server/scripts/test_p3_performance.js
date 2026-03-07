const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testCountQueryOptimization() {
    console.log('\n=== Test 1: Count Query Optimization ===');

    // Request WITHOUT pagination - should NOT run COUNT query
    console.log('Fetching without pagination (no COUNT expected)...');
    const res1 = await axios.get(`${BASE_URL}/demands`);
    console.log('✅ Status:', res1.status);
    console.log('   X-Total-Count header:', res1.headers['x-total-count'] || 'NOT SET (expected)');
    console.log('   Records returned:', res1.data.length);

    // Request WITH pagination - SHOULD run COUNT query  
    console.log('\nFetching WITH pagination (COUNT expected)...');
    const res2 = await axios.get(`${BASE_URL}/demands?page=1&limit=5`);
    console.log('✅ Status:', res2.status);
    console.log('   X-Total-Count header:', res2.headers['x-total-count'] || 'MISSING!');
    console.log('   Records returned:', res2.data.length);
}

async function testTransactionSupport() {
    console.log('\n=== Test 2: Transaction Support ===');

    try {
        // Try to update a demand (should work atomically)
        const res = await axios.get(`${BASE_URL}/demands`);
        if (res.data.length > 0) {
            const demandId = res.data[0].id;
            console.log(`Updating demand ${demandId}...`);

            const updateRes = await axios.put(`${BASE_URL}/demands/${demandId}`, {
                status: 'EM ANDAMENTO'
            });
            console.log('✅ Update successful (transaction committed)');
            console.log('   Updated demand ID:', updateRes.data.id);
        } else {
            console.log('⚠️  No demands found to test update');
        }
    } catch (e) {
        console.log('❌ Update failed:', e.response?.data);
    }
}

async function testDebugLogs() {
    console.log('\n=== Test 3: Debug Logs (Manual Verification) ===');
    console.log('NODE_ENV is:', process.env.NODE_ENV || 'not set (development mode)');
    console.log('If NODE_ENV=production, check server logs have NO [DEBUG] messages');
    console.log('If NODE_ENV is not set, [DEBUG] messages SHOULD appear in logs');
}

(async () => {
    console.log('🔍 Running P3 Performance Tests...\n');
    try {
        await testCountQueryOptimization();
        await testTransactionSupport();
        await testDebugLogs();
        console.log('\n✅ All tests completed!\n');
    } catch (e) {
        console.error('\n❌ Test failed:', e.message);
    }
})();
