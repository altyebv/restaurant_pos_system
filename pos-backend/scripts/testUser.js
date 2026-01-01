// test-register.js - Run this to test user registration
const fetch = require('node-fetch'); // or use axios if you prefer

async function testRegistration() {
    try {
        console.log('Testing user registration...');
        
        const response = await fetch('http://localhost:3000/api/user/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: "Test Cashier",
                email: "test@test.com",
                phone: "1234567890",
                password: "test123",
                role: "cashier",
                cashierCode: "A1"
            })
        });

        const data = await response.json();
        console.log('Response:', data);

        if (data.success) {
            console.log('✅ Registration successful!');
            return data;
        } else {
            console.log('❌ Registration failed:', data.message);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function testLogin() {
    try {
        console.log('\nTesting login...');
        
        const response = await fetch('http://localhost:3000/api/user/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: "test@test.com",
                password: "test123"
            })
        });

        const data = await response.json();
        console.log('Response:', data);

        if (data.success) {
            console.log('✅ Login successful!');
            console.log('User:', data.data.user);
            console.log('Session:', data.data.session);
        } else {
            console.log('❌ Login failed:', data.message);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run tests
(async () => {
    await testRegistration();
    await testLogin();
})();

// Or use this simpler Postman-style request:
// POST http://localhost:3000/api/user/register
// Body (raw JSON):
/*
{
    "name": "Test Cashier",
    "email": "test@test.com",
    "phone": "1234567890",
    "password": "test123",
    "role": "cashier",
    "cashierCode": "A1"
}
*/