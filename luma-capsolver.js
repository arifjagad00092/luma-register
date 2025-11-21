require('dotenv').config();
const axios = require('axios');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const fs = require('fs').promises;

class LumaAutoRegister {
    constructor() {
        // CORRECT API BASE
        this.apiBase = 'https://api2.luma.com';
        
        // Event details - UPDATE THESE!
        this.eventApiId = 'evt-nTA5QQPkL5SrU9g';
        this.ticketTypeId = 'evtticktyp-jt1CuD6jUgwysWF';
        this.eventURL = 'https://lu.ma/halfbakedhackathon';
        
        this.capsolverApiKey = process.env.CAPSOLVER_API_KEY;
        
        this.imapConfig = {
            user: process.env.EMAIL_USER,
            password: process.env.EMAIL_PASSWORD,
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false }
        };

        if (!this.capsolverApiKey) throw new Error('CAPSOLVER_API_KEY missing');
        if (!this.imapConfig.user || !this.imapConfig.password) throw new Error('EMAIL credentials missing');
    }

    getUserAgent() {
        return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    }

    getHeaders(cookies = null) {
        const headers = {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Content-Type': 'application/json',
            'Origin': 'https://lu.ma',
            'Referer': this.eventURL,
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site',
            'User-Agent': this.getUserAgent()
        };

        if (cookies) {
            headers['Cookie'] = cookies;
        }

        return headers;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ==================== CLOUDFLARE SOLVER ====================

    async solveCloudflare(url) {
        try {
            console.log('🔓 Solving Cloudflare...');
            
            const createResponse = await axios.post('https://api.capsolver.com/createTask', {
                clientKey: this.capsolverApiKey,
                task: {
                    type: 'AntiCloudflareTask',
                    websiteURL: url,
                    metadata: { type: 'challenge' }
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
                    return resultResponse.data.solution;
                }

                if (resultResponse.data.status === 'failed') {
                    throw new Error('CapSolver failed');
                }

                if (i % 5 === 0) console.log(`   ⏳ ${i * 2}s...`);
            }

            throw new Error('Timeout');

        } catch (error) {
            console.error('❌ CapSolver error:', error.message);
            throw error;
        }
    }

    // ==================== LUMA API - CORRECT ENDPOINTS ====================

    /**
     * Register for event - EXACT payload structure from your example
     */
    async registerEvent(firstName, lastName, email, cookies = null) {
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
                    headers: this.getHeaders(cookies),
                    timeout: 30000,
                    validateStatus: (status) => status < 500
                }
            );

            // Success
            if (response.status === 200 || response.status === 201) {
                console.log('   ✅ Registration successful!');
                return {
                    success: true,
                    data: response.data,
                    cookies: response.headers['set-cookie']
                };
            }

            // Cloudflare challenge
            if (response.status === 403 || response.status === 503) {
                console.log('   ⚠️  Cloudflare detected');
                return {
                    success: false,
                    needsSolve: true,
                    status: response.status
                };
            }

            // Other error
            throw new Error(`Status ${response.status}: ${JSON.stringify(response.data)}`);

        } catch (error) {
            if (error.response) {
                console.error('   ❌ Error:', error.response.status, error.response.data);
                
                // Cloudflare detected
                if (error.response.status === 403 || error.response.status === 503) {
                    return {
                        success: false,
                        needsSolve: true,
                        status: error.response.status
                    };
                }
                
                return {
                    success: false,
                    needsSolve: false,
                    error: error.response.data
                };
            }

            console.error('   ❌ Network error:', error.message);
            throw error;
        }
    }

    /**
     * Register with Cloudflare solution
     */
    async registerWithSolution(firstName, lastName, email, solution) {
        try {
            console.log('   🔄 Retrying with solution...');

            const cookies = solution.cookies || null;
            return await this.registerEvent(firstName, lastName, email, cookies);

        } catch (error) {
            console.error('   ❌ Still failed:', error.message);
            throw error;
        }
    }

    /**
     * Send sign-in code - CORRECT endpoint
     */
    async sendSignInCode(email, cookies = null) {
        try {
            console.log(`\n📧 Sending sign-in code: ${email}`);

            const response = await axios.post(
                `${this.apiBase}/auth/email/send-sign-in-code`,
                { email: email },
                {
                    headers: this.getHeaders(cookies),
                    timeout: 30000,
                    validateStatus: (status) => status < 500
                }
            );

            if (response.status === 200 || response.status === 201) {
                console.log('   ✅ Code sent!');
                return response.data;
            }

            throw new Error(`Failed: ${response.status}`);

        } catch (error) {
            console.error('   ❌ Failed:', error.message);
            throw error;
        }
    }

    /**
     * Sign in with code - CORRECT endpoint
     */
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
                    headers: this.getHeaders(cookies),
                    timeout: 30000,
                    validateStatus: (status) => status < 500
                }
            );

            if (response.status === 200 || response.status === 201) {
                console.log('   ✅ Sign-in successful!');
                return response.data;
            }

            throw new Error(`Failed: ${response.status}`);

        } catch (error) {
            console.error('   ❌ Failed:', error.message);
            throw error;
        }
    }

    // ==================== GMAIL ====================

    async getVerificationCode(email, maxAttempts = 20, delaySeconds = 10) {
        console.log(`\n📬 Waiting for verification code...`);

        return new Promise((resolve, reject) => {
            let attempts = 0;

            const checkEmail = () => {
                attempts++;
                console.log(`   📥 Attempt ${attempts}/${maxAttempts}...`);

                const imap = new Imap(this.imapConfig);

                imap.once('ready', () => {
                    imap.openBox('INBOX', false, (err) => {
                        if (err) {
                            imap.end();
                            if (attempts < maxAttempts) {
                                setTimeout(checkEmail, delaySeconds * 1000);
                            } else {
                                reject(new Error('Inbox error'));
                            }
                            return;
                        }

                        const searchCriteria = [
                            ['FROM', 'luma'],
                            ['SINCE', new Date(Date.now() - 10 * 60 * 1000)]
                        ];

                        imap.search(searchCriteria, (err, results) => {
                            if (err || !results || results.length === 0) {
                                console.log('   ⏳ No email yet...');
                                imap.end();
                                if (attempts < maxAttempts) {
                                    setTimeout(checkEmail, delaySeconds * 1000);
                                } else {
                                    reject(new Error('Email not received'));
                                }
                                return;
                            }

                            console.log(`   📧 Found ${results.length} email(s)`);
                            const fetch = imap.fetch(results.slice(-1), { bodies: '' });

                            fetch.on('message', (msg) => {
                                msg.on('body', (stream) => {
                                    simpleParser(stream, (err, parsed) => {
                                        if (err) return;

                                        const content = (parsed.text || '') + (parsed.html || '');
                                        const codeMatch = content.match(/\b(\d{6})\b/);

                                        if (codeMatch) {
                                            const code = codeMatch[1];
                                            console.log(`   ✅ Code found: ${code}`);
                                            imap.end();
                                            resolve(code);
                                        } else {
                                            console.log('   ⚠️  Email found but no code');
                                        }
                                    });
                                });
                            });

                            fetch.once('error', () => {
                                imap.end();
                                if (attempts < maxAttempts) {
                                    setTimeout(checkEmail, delaySeconds * 1000);
                                }
                            });

                            fetch.once('end', () => {
                                setTimeout(() => {
                                    if (attempts < maxAttempts) {
                                        imap.end();
                                        setTimeout(checkEmail, delaySeconds * 1000);
                                    }
                                }, 2000);
                            });
                        });
                    });
                });

                imap.once('error', (err) => {
                    console.error('   ⚠️  IMAP error:', err.message);
                    if (attempts < maxAttempts) {
                        setTimeout(checkEmail, delaySeconds * 1000);
                    } else {
                        reject(err);
                    }
                });

                imap.once('end', () => {
                    // Connection ended
                });

                try {
                    imap.connect();
                } catch (error) {
                    console.error('   ⚠️  Connection failed');
                    if (attempts < maxAttempts) {
                        setTimeout(checkEmail, delaySeconds * 1000);
                    } else {
                        reject(error);
                    }
                }
            };

            checkEmail();
        });
    }

    // ==================== MAIN FLOW ====================

    async processRegistration(firstName, lastName, email) {
        try {
            console.log('\n' + '='.repeat(70));
            console.log(`🚀 Registration: ${firstName} ${lastName} <${email}>`);
            console.log('='.repeat(70));

            // Step 1: Direct register (Cloudflare biasanya tidak block API calls)
            let result = await this.registerEvent(firstName, lastName, email);
            let cookies = null;

            // Only solve if actually blocked
            if (result.needsSolve) {
                console.log('\n⚠️  Cloudflare blocking API - this is unusual');
                console.log('💡 Tip: Cloudflare usually only blocks browser, not API');
                console.log('💡 Try: Add cookies from browser or use different network\n');
                
                throw new Error('Cloudflare blocked API call - manual intervention needed');
            }

            if (!result.success) {
                throw new Error(result.error || 'Registration failed');
            }

            // Save cookies
            if (result.cookies) {
                cookies = Array.isArray(result.cookies) 
                    ? result.cookies.join('; ') 
                    : result.cookies;
            }

            await this.delay(2000);

            // Step 2: Send verification code
            await this.sendSignInCode(email, cookies);

            // Step 3: Get code from Gmail
            const code = await this.getVerificationCode(email);

            await this.delay(1000);

            // Step 4: Sign in with code
            const authResult = await this.signInWithCode(email, code, cookies);

            console.log('\n✨ Registration completed successfully!');
            console.log('='.repeat(70));

            return {
                success: true,
                email: email,
                authToken: authResult.token || null,
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

    async processBatch(emailFile = 'email.json') {
        try {
            const data = await fs.readFile(emailFile, 'utf8');
            const emails = JSON.parse(data);

            if (!Array.isArray(emails) || emails.length === 0) {
                throw new Error('email.json must contain array of users');
            }

            console.log('\n' + '🎯'.repeat(35));
            console.log(`📋 Processing ${emails.length} users`);
            console.log(`💰 Estimated cost: ~$${(emails.length * 0.003).toFixed(3)}`);
            console.log('🎯'.repeat(35));

            const results = [];

            for (let i = 0; i < emails.length; i++) {
                const user = emails[i];

                // Support both formats: underscore and camelCase
                const firstName = user.first_name || user.firstName;
                const lastName = user.last_name || user.lastName;
                const email = user.email;

                if (!firstName || !lastName || !email) {
                    console.error(`\n❌ Invalid user at index ${i}:`, user);
                    results.push({
                        success: false,
                        email: email || 'unknown',
                        error: 'Missing required fields (first_name, last_name, email)',
                        timestamp: new Date().toISOString()
                    });
                    continue;
                }

                console.log(`\n📍 [${i + 1}/${emails.length}]`);

                const result = await this.processRegistration(
                    firstName,
                    lastName,
                    email
                );

                results.push(result);

                // Delay between users
                if (i < emails.length - 1) {
                    const delay = 30 + Math.random() * 30;
                    console.log(`\n⏳ Waiting ${Math.floor(delay)}s...\n`);
                    await this.delay(delay * 1000);
                }
            }

            // Save results
            await fs.writeFile('results.json', JSON.stringify(results, null, 2));
            console.log('\n📊 Results saved to results.json');

            // Summary
            const successful = results.filter(r => r.success).length;
            const failed = results.filter(r => !r.success).length;

            console.log('\n' + '='.repeat(70));
            console.log('📈 SUMMARY');
            console.log('='.repeat(70));
            console.log(`✅ Success: ${successful}/${emails.length}`);
            console.log(`❌ Failed: ${failed}/${emails.length}`);
            console.log(`💰 Actual cost: ~$${(successful * 0.003).toFixed(3)}`);
            console.log('='.repeat(70));

            return results;

        } catch (error) {
            console.error('\n❌ Batch processing failed:', error.message);
            throw error;
        }
    }
}

// Run
if (require.main === module) {
    console.log('🚀 Luma Auto Register - CORRECT API VERSION');
    console.log('==========================================\n');

    const bot = new LumaAutoRegister();

    bot.processBatch()
        .then(() => {
            console.log('\n🎉 All done!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Fatal error:', error.message);
            process.exit(1);
        });
}

module.exports = LumaAutoRegister;