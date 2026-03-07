const axios = require('axios');

const email = 'gestor@fluxo.com';
const password = '123';

async function testLogin() {
    try {
        console.log('Testing GET /users?email=...');
        const userRes = await axios.get('http://localhost:3000/users', { params: { email } });
        console.log('Status:', userRes.status);
        console.log('Data:', userRes.data);

        if (userRes.data.length > 0) {
            const user = userRes.data[0];
            console.log('User found:', user.email);
            console.log('DB Password:', user.password);
            console.log('Input Password:', password);
            console.log('Match?', user.password === password);
        } else {
            console.log('No user found');
        }
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.log('Response Status:', error.response.status);
            console.log('Response Data:', error.response.data);
        }
    }
}

testLogin();
