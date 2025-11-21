require('dotenv').config();
const axios = require('axios');

async function checkBalance() {
    const apiKey = process.env.CAPSOLVER_API_KEY;

    if (!apiKey) {
        console.error('❌ CAPSOLVER_API_KEY not found in .env');
        process.exit(1);
    }

    console.log('🔍 Checking CapSolver balance...\n');

    try {
        const response = await axios.post('https://api.capsolver.com/getBalance', {
            clientKey: apiKey
        });

        if (response.data.errorId === 0) {
            const balance = response.data.balance;
            console.log('✅ CapSolver Account Status:');
            console.log('='.repeat(50));
            console.log(`💰 Balance: $${(balance / 1000).toFixed(4)}`);
            console.log(`   Raw: ${balance} (in micro-dollars)`);
            console.log('='.repeat(50));

            if (balance < 100) {
                console.log('\n⚠️  WARNING: Balance sangat rendah!');
                console.log('   Minimum recommended: $0.10 (100 micro-dollars)');
                console.log('   Top up di: https://dashboard.capsolver.com/');
            } else {
                console.log('\n✅ Balance cukup untuk solve Turnstile');
            }

            if (response.data.packages) {
                console.log('\n📦 Packages:', response.data.packages);
            }
        } else {
            console.error('❌ Error:', response.data.errorDescription);
            console.log('\n⚠️  Kemungkinan masalah:');
            console.log('   1. API Key invalid');
            console.log('   2. API Key expired');
            console.log('   3. Connection error');
        }

    } catch (error) {
        console.error('❌ Failed to check balance:', error.message);

        if (error.response) {
            console.log('\nAPI Response:', error.response.data);
        }
    }
}

checkBalance();
