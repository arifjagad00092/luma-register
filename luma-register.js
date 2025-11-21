require('dotenv').config();
const axios = require('axios');
const fs = require('fs').promises;
const ManualEmailReader = require('./email-reader-manual');

class LumaAutoRegister {
    constructor(useManualInput = false) {
        this.apiBase = 'https://api2.luma.com';

        this.eventApiId = 'evt-nTA5QQPkL5SrU9g';
        this.ticketTypeId = 'evtticktyp-jt1CuD6jUgwysWF';
        this.eventURL = 'https://lu.ma/halfbakedhackathon';

        this.capsolverApiKey = process.env.CAPSOLVER_API_KEY;
        this.useManualInput = useManualInput;

        if (this.useManualInput) {
            console.log('📧 Using MANUAL email input mode');
            this.emailReader = new ManualEmailReader();
        } else {
            console.log('⚠️  IMAP mode disabled due to compatibility issues');
            console.log('📧 Using MANUAL email input mode');
            this.emailReader = new ManualEmailReader();
            this.useManualInput = true;
        }

        if (!this.capsolverApiKey) throw new Error('CAPSOLVER_API_KEY missing');
    }

    getRandomUserAgent() {
        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0'
        ];
        return userAgents[Math.floor(Math.random() * userAgents.length)];
    }

    getHeaders(turnstileToken = null, cookies = null) {
        const headers = {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Content-Type': 'application/json',
            'Origin': 'https://lu.ma',
            'Referer': this.eventURL,
            'Sec-Ch-Ua': '"Chromium";v="131", "Not_A Brand";v="24"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site',
            'User-Agent': this.getRandomUserAgent(),
            'X-Luma-Client': 'web'
        };

        if (turnstileToken) {
            headers['cf-turnstile-response'] = turnstileToken;
        }

        if (cookies) {
            headers['Cookie'] = cookies;
        }

        return headers;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async checkCapsolverBalance() {
        try {
            const response = await axios.post('https://api.capsolver.com/getBalance', {
                clientKey: this.capsolverApiKey
            }, { timeout: 10000 });

            if (response.data.errorId === 0) {
                const balance = response.data.balance;
                const balanceUSD = (balance / 1000).toFixed(4);
                console.log(`   💰 CapSolver Balance: $${balanceUSD}`);

                if (balance < 10) {
                    console.log('   ⚠️  WARNING: Balance sangat rendah! Turnstile solve mungkin gagal.');
                    console.log('   💡 Top up: https://dashboard.capsolver.com/');
                    return false;
                }
                return true;
            } else {
                console.log('   ⚠️  Could not verify balance');
                return true;
            }
        } catch (error) {
            console.log('   ⚠️  Balance check failed:', error.message);
            return true;
        }
    }

    async solveTurnstile(websiteURL, websiteKey) {
        try {
            console.log('🔓 Solving Turnstile...');

            const hasBalance = await this.checkCapsolverBalance();
            if (!hasBalance) {
                throw new Error('Insufficient CapSolver balance. Please top up your account.');
            }

            const createResponse = await axios.post('https://api.capsolver.com/createTask', {
                clientKey: this.capsolverApiKey,
                task: {
                    type: 'AntiTurnstileTaskProxyLess',
                    websiteURL: websiteURL,
                    websiteKey: websiteKey
                }
            }, { timeout: 30000 });

            if (createResponse.data.errorId && createResponse.data.errorId !== 0) {
                throw new Error(`CapSolver: ${createResponse.data.errorDescription}`);
            }

            const taskId = createResponse.data.taskId;
            console.log(`   Task: ${taskId}`);

            for (let i = 0; i < 60; i++) {
                await this.delay(2000);

                const resultResponse = await axios.post('https://api.capsolver.com/getTaskResult', {
                    clientKey: this.capsolverApiKey,
                    taskId: taskId
                }, { timeout: 30000 });

                if (resultResponse.data.status === 'ready') {
                    console.log('   ✅ Solved!');
                    return resultResponse.data.solution.token;
                }

                if (resultResponse.data.status === 'failed') {
                    throw new Error(`CapSolver failed: ${resultResponse.data.errorDescription || 'Unknown'}`);
                }

                if (i % 5 === 0) console.log(`   ⏳ ${i * 2}s...`);
            }

            throw new Error('Timeout');

        } catch (error) {
            console.error('❌ CapSolver error:', error.message);
            throw error;
        }
    }

    async registerEvent(firstName, lastName, email, turnstileToken = null, cookies = null) {
        try {
            console.log(`\n📝 Registering: ${firstName} ${lastName} (${email})`);

            const payload = {
                name: "",
                first_name: firstName,
                last_name: lastName,
                email: email,
                event_api_id: this.eventApiId,
                for_waitlist: false,
                payment_method: null,
                payment_currency: null,
                registration_answers: [],
                coupon_code: null,
                timezone: "Asia/Jakarta",
                token_gate_info: null,
                eth_address_info: null,
                phone_number: "",
                solana_address_info: null,
                expected_amount_cents: 0,
                expected_amount_discount: 0,
                expected_amount_tax: 0,
                currency: null,
                event_invite_api_id: null,
                ticket_type_to_selection: {
                    [this.ticketTypeId]: {
                        count: 1,
                        amount: 0
                    }
                },
                solana_address: null,
                opened_from: null
            };

            const response = await axios.post(
                `${this.apiBase}/event/register`,
                payload,
                {
                    headers: this.getHeaders(turnstileToken, cookies),
                    timeout: 30000,
                    validateStatus: (status) => status < 500
                }
            );

            if (response.status === 200 || response.status === 201) {
                console.log('   ✅ Registration successful!');
                console.log('   📋 Response preview:', JSON.stringify(response.data).substring(0, 200));

                // Check if response body indicates already registered
                const responseText = JSON.stringify(response.data).toLowerCase();
                if (responseText.includes('already registered') || responseText.includes('already_registered')) {
                    console.log('   ℹ️  (Actually already registered based on response body)');
                    return {
                        success: true,
                        alreadyRegistered: true,
                        data: response.data,
                        cookies: response.headers['set-cookie']
                    };
                }

                return {
                    success: true,
                    data: response.data,
                    cookies: response.headers['set-cookie']
                };
            }

            if (response.status === 400) {
                console.log('   ⚠️  400 Response received');
                console.log('   📋 Response data:', JSON.stringify(response.data, null, 2));

                const responseText = JSON.stringify(response.data).toLowerCase();
                if (responseText.includes('already registered')) {
                    console.log('   ℹ️  Email already registered - treating as success');
                    return {
                        success: true,
                        alreadyRegistered: true,
                        data: response.data,
                        cookies: response.headers['set-cookie']
                    };
                }

                // Jika 400 tapi bukan "already registered", tetap error
                console.log('   ❌ 400 error - NOT already registered');
                return {
                    success: false,
                    error: response.data
                };
            }

            if (response.status === 403) {
                console.log('   ⚠️  403 Response received');
                console.log('   📋 Response data:', JSON.stringify(response.data, null, 2));

                const responseText = JSON.stringify(response.data).toLowerCase();

                // Check for "additional verification required"
                if (responseText.includes('additional-verification-required') ||
                    responseText.includes('additional verification')) {
                    console.log('   🛡️  Luma detected suspicious activity - additional verification required');
                    console.log('   💡 Solusi: Tunggu beberapa menit atau gunakan IP/proxy berbeda');
                    return {
                        success: false,
                        needsWait: true,
                        error: 'Rate limited - additional verification required'
                    };
                }

                console.log('   🔍 Checking if this is Turnstile...');
                const hasTurnstile = responseText.includes('turnstile') ||
                                   responseText.includes('cf-turnstile') ||
                                   responseText.includes('cloudflare');

                if (hasTurnstile) {
                    console.log('   ✅ Confirmed: Turnstile challenge detected');
                    return {
                        success: false,
                        needsTurnstile: true,
                        data: response.data
                    };
                } else {
                    console.log('   ❌ NOT Turnstile - different error!');
                    return {
                        success: false,
                        needsTurnstile: false,
                        error: response.data
                    };
                }
            }

            throw new Error(`Status ${response.status}: ${JSON.stringify(response.data)}`);

        } catch (error) {
            if (error.response) {
                console.error('   ❌ Error:', error.response.status, JSON.stringify(error.response.data).substring(0, 200));

                if (error.response.status === 403) {
                    console.log('   📋 Error response data:', JSON.stringify(error.response.data, null, 2));

                    const responseText = JSON.stringify(error.response.data).toLowerCase();
                    const hasTurnstile = responseText.includes('turnstile') ||
                                       responseText.includes('cf-turnstile') ||
                                       responseText.includes('cloudflare');

                    return {
                        success: false,
                        needsTurnstile: hasTurnstile,
                        data: error.response.data
                    };
                }

                return {
                    success: false,
                    error: error.response.data
                };
            }

            console.error('   ❌ Network error:', error.message);
            throw error;
        }
    }

    async sendSignInCode(email, cookies = null) {
        try {
            console.log(`\n📧 Sending sign-in code: ${email}`);

            const response = await axios.post(
                `${this.apiBase}/auth/email/send-sign-in-code`,
                { email: email },
                {
                    headers: this.getHeaders(null, cookies),
                    timeout: 30000,
                    validateStatus: (status) => status < 500
                }
            );

            if (response.status === 200 || response.status === 201) {
                console.log('   ✅ Code sent!');
                return { success: true, data: response.data };
            }

            throw new Error(`Failed: ${response.status}`);

        } catch (error) {
            console.error('   ❌ Failed:', error.message);
            throw error;
        }
    }

    async signInWithCode(email, code, cookies = null) {
        try {
            console.log(`\n🔐 Signing in with code: ${code}`);

            const response = await axios.post(
                `${this.apiBase}/auth/email/sign-in-with-code`,
                {
                    email: email,
                    code: code
                },
                {
                    headers: this.getHeaders(null, cookies),
                    timeout: 30000,
                    validateStatus: (status) => status < 500
                }
            );

            if (response.status === 200 || response.status === 201) {
                console.log('   ✅ Sign-in successful!');
                return { success: true, data: response.data };
            }

            throw new Error(`Failed: ${response.status} - ${JSON.stringify(response.data)}`);

        } catch (error) {
            console.error('   ❌ Failed:', error.message);
            throw error;
        }
    }

    async getVerificationCode(email, maxAttempts = 20, delaySeconds = 10) {
        try {
            const code = await this.emailReader.getVerificationCode(
                'luma',
                10,
                maxAttempts,
                delaySeconds
            );
            return code;
        } catch (error) {
            console.error('   ❌ Failed to get verification code:', error.message);
            throw error;
        }
    }

    async processRegistration(firstName, lastName, email, turnstileKey = null) {
        try {
            console.log('\n' + '='.repeat(70));
            console.log(`🚀 Registration: ${firstName} ${lastName} <${email}>`);
            console.log('='.repeat(70));

            let turnstileToken = null;
            let cookies = null;

            let result = await this.registerEvent(firstName, lastName, email);

            if (result.needsTurnstile) {
                if (!turnstileKey) {
                    throw new Error('Turnstile required but no websiteKey provided. Check browser DevTools to find the key.');
                }

                console.log('\n⚠️  Turnstile challenge detected, solving...');
                turnstileToken = await this.solveTurnstile(this.eventURL, turnstileKey);

                result = await this.registerEvent(firstName, lastName, email, turnstileToken);
            }

            if (!result.success) {
                throw new Error(JSON.stringify(result.error || 'Registration failed'));
            }

            if (result.alreadyRegistered) {
                console.log('\n✨ Email already registered - skipping sign-in');
                console.log('='.repeat(70));
                return {
                    success: true,
                    email: email,
                    alreadyRegistered: true,
                    timestamp: new Date().toISOString()
                };
            }

            if (result.cookies) {
                cookies = Array.isArray(result.cookies)
                    ? result.cookies.join('; ')
                    : result.cookies;
            }

            await this.delay(2000);

            const sendResult = await this.sendSignInCode(email, cookies);
            if (!sendResult.success) {
                throw new Error('Failed to send sign-in code');
            }

            const code = await this.getVerificationCode(email);

            if (!code) {
                throw new Error('No verification code provided (timeout or skipped)');
            }

            await this.delay(1000);

            const authResult = await this.signInWithCode(email, code, cookies);
            if (!authResult.success) {
                throw new Error('Failed to sign in with code');
            }

            console.log('\n✨ Registration completed successfully!');
            console.log('='.repeat(70));

            return {
                success: true,
                email: email,
                authToken: authResult.data.token || null,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`\n❌ Failed: ${error.message}`);
            console.error('='.repeat(70));

            return {
                success: false,
                email: email,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async processBatch(emailFile = 'email.json', turnstileKey = null) {
        try {
            const data = await fs.readFile(emailFile, 'utf8');
            const emails = JSON.parse(data);

            if (!Array.isArray(emails) || emails.length === 0) {
                throw new Error('email.json must contain array of users');
            }

            console.log('\n' + '🎯'.repeat(35));
            console.log(`📋 Processing ${emails.length} users`);
            console.log('🎯'.repeat(35));

            const results = [];

            for (let i = 0; i < emails.length; i++) {
                const user = emails[i];

                const firstName = user.first_name || user.firstName;
                const lastName = user.last_name || user.lastName;
                const email = user.email;

                if (!firstName || !lastName || !email) {
                    console.error(`\n❌ Invalid user at index ${i}:`, user);
                    results.push({
                        success: false,
                        email: email || 'unknown',
                        error: 'Missing required fields',
                        timestamp: new Date().toISOString()
                    });
                    continue;
                }

                console.log(`\n📍 [${i + 1}/${emails.length}]`);

                let result = await this.processRegistration(
                    firstName,
                    lastName,
                    email,
                    turnstileKey
                );

                // Jika kena rate limit, tunggu dan retry sekali
                if (!result.success && result.error &&
                    (result.error.includes('additional verification') || result.error.includes('rate limit'))) {
                    console.log('\n⏸️  Rate limited detected, waiting 60s before retry...');
                    await this.delay(60000); // Wait 60s

                    console.log('\n🔄 Retrying registration...');
                    result = await this.processRegistration(
                        firstName,
                        lastName,
                        email,
                        turnstileKey
                    );
                }

                results.push(result);

                if (i < emails.length - 1) {
                    // Random delay antara 8-15 detik untuk menghindari rate limit
                    const delay = Math.floor(Math.random() * 8) + 8; // 8-15s
                    console.log(`\n⏳ Waiting ${delay}s to avoid rate limit...\n`);
                    await this.delay(delay * 1000);
                }
            }

            await fs.writeFile('results.json', JSON.stringify(results, null, 2));
            console.log('\n📊 Results saved to results.json');

            const successful = results.filter(r => r.success).length;
            const failed = results.filter(r => !r.success).length;

            console.log('\n' + '='.repeat(70));
            console.log('📈 SUMMARY');
            console.log('='.repeat(70));
            console.log(`✅ Success: ${successful}/${emails.length}`);
            console.log(`❌ Failed: ${failed}/${emails.length}`);
            console.log('='.repeat(70));

            return results;

        } catch (error) {
            console.error('\n❌ Batch processing failed:', error.message);
            throw error;
        }
    }
}

if (require.main === module) {
    console.log('🚀 Luma Auto Register with Turnstile Support');
    console.log('='.repeat(70));
    console.log('💡 If Turnstile is required, find the websiteKey in browser DevTools');
    console.log('   (Network tab > look for turnstile challenge)');
    console.log('='.repeat(70) + '\n');

    const bot = new LumaAutoRegister();

    const turnstileKey = process.env.TURNSTILE_KEY || null;

    bot.processBatch('email.json', turnstileKey)
        .then(() => {
            console.log('\n🎉 All done!');
            if (bot.emailReader && bot.emailReader.close) {
                bot.emailReader.close();
            }
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Fatal error:', error.message);
            if (bot.emailReader && bot.emailReader.close) {
                bot.emailReader.close();
            }
            process.exit(1);
        });
}

module.exports = LumaAutoRegister;
