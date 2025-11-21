require('dotenv').config();
const LumaAutoRegister = require('./luma-register.js');

async function testSingle() {
    console.log('🧪 Testing single registration with MANUAL email input...\n');
    console.log('ℹ️  You will be asked to enter the verification code from your email\n');

    const bot = new LumaAutoRegister(true);

    const turnstileKey = process.env.TURNSTILE_KEY || null;

    const result = await bot.processRegistration(
        'Diky',
        'Wahyudi',
        'dikywahyudi01821@gmail.com',
        turnstileKey
    );

    console.log('\n📋 Final Result:', JSON.stringify(result, null, 2));

    if (result.success) {
        console.log('\n✅ Test passed!');
        process.exit(0);
    } else {
        console.log('\n❌ Test failed!');
        process.exit(1);
    }
}

testSingle().catch(error => {
    console.error('\n💥 Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
});
