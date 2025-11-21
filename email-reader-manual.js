const readline = require('readline');

class ManualEmailReader {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async getVerificationCode(email, maxAttempts = 1, delaySeconds = 0) {
        console.log(`\n📬 Email verification code will be sent to: ${email}`);
        console.log(`   ℹ️  Check your email and enter the 6-digit code below`);
        console.log('');

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                console.log('\n   ⏰ Timeout waiting for input (60s). Skipping...');
                resolve(null);
            }, 60000);

            this.rl.question('   Enter verification code: ', (code) => {
                clearTimeout(timeout);

                const sanitized = code.trim().replace(/\s/g, '');

                if (/^\d{6}$/.test(sanitized)) {
                    console.log(`   ✅ Code received: ${sanitized}`);
                    resolve(sanitized);
                } else if (sanitized === '') {
                    console.log(`   ⏭️  Skipping (empty input)`);
                    resolve(null);
                } else {
                    console.error(`   ❌ Invalid code format. Expected 6 digits, got: ${sanitized}`);
                    console.log(`   ⏭️  Skipping...`);
                    resolve(null);
                }
            });

            setTimeout(() => {
                console.log('   ⏳ Waiting for your input...');
            }, 5000);
        });
    }

    close() {
        if (this.rl) {
            this.rl.close();
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = ManualEmailReader;
