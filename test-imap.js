require('dotenv').config();
const EmailReader = require('./email-reader');

async function testIMAP() {
    console.log('🧪 Testing IMAP Connection...\n');

    console.log('📋 Configuration:');
    console.log(`   User: ${process.env.EMAIL_USER}`);
    console.log(`   Password: ${process.env.EMAIL_PASSWORD ? '***' + process.env.EMAIL_PASSWORD.slice(-4) : 'NOT SET'}`);
    console.log('');

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.error('❌ EMAIL_USER or EMAIL_PASSWORD not set in .env');
        process.exit(1);
    }

    const emailReader = new EmailReader({
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
        host: 'imap.gmail.com',
        port: 993
    });

    try {
        console.log('🔍 Searching for recent emails from Luma...\n');

        const searchCriteria = [
            ['FROM', 'luma'],
            ['SINCE', new Date(Date.now() - 24 * 60 * 60 * 1000)]
        ];

        const parsed = await emailReader.searchEmail(searchCriteria, 3, 5);

        if (parsed) {
            console.log('\n✅ Email found!');
            console.log(`   From: ${parsed.from?.text || 'unknown'}`);
            console.log(`   Subject: ${parsed.subject || 'no subject'}`);
            console.log(`   Date: ${parsed.date || 'no date'}`);
            console.log('');

            const content = (parsed.text || '') + (parsed.html || '');
            console.log(`   Content length: ${content.length} chars`);

            const patterns = [
                /\b(\d{6})\b/,
                /code[:\s]+(\d{6})/i,
                /verification[:\s]+(\d{6})/i
            ];

            console.log('\n🔍 Looking for verification code...');
            for (const pattern of patterns) {
                const match = content.match(pattern);
                if (match && match[1]) {
                    console.log(`   ✅ Found code: ${match[1]} (using pattern: ${pattern})`);
                    break;
                }
            }

            console.log('\n📄 Email content preview (first 500 chars):');
            console.log('─'.repeat(70));
            console.log(content.substring(0, 500));
            console.log('─'.repeat(70));

        } else {
            console.log('\n⚠️  No email from Luma found in the last 24 hours');
            console.log('\n💡 Tips:');
            console.log('   1. Make sure you have emails from Luma in your inbox');
            console.log('   2. Check if Gmail App Password is correct');
            console.log('   3. Try sending a test email from Luma first');
        }

        console.log('\n✅ IMAP connection test completed!');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ IMAP test failed:', error.message);
        console.error('\n🔍 Troubleshooting:');
        console.error('   1. Gmail App Password:');
        console.error('      - Go to: https://myaccount.google.com/apppasswords');
        console.error('      - Create new app password');
        console.error('      - Update EMAIL_PASSWORD in .env');
        console.error('');
        console.error('   2. Gmail IMAP Settings:');
        console.error('      - Go to Gmail Settings > Forwarding and POP/IMAP');
        console.error('      - Enable IMAP access');
        console.error('');
        console.error('   3. 2-Step Verification:');
        console.error('      - Must be enabled to use App Passwords');
        console.error('      - Go to: https://myaccount.google.com/security');
        console.error('');

        console.error('Full error:');
        console.error(error);

        process.exit(1);
    }
}

testIMAP();
