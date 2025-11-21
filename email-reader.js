const Imap = require('node-imap');
const { simpleParser } = require('mailparser');

class EmailReader {
    constructor(config) {
        this.config = {
            user: config.user,
            password: config.password,
            host: config.host || 'imap.gmail.com',
            port: config.port || 993,
            tls: true,
            tlsOptions: {
                rejectUnauthorized: false,
                servername: config.host || 'imap.gmail.com'
            },
            authTimeout: 30000,
            connTimeout: 30000,
            keepalive: false
        };
    }

    async searchEmail(searchCriteria, maxAttempts = 20, delaySeconds = 10) {
        console.log(`\n📬 Searching for email...`);
        console.log(`   Criteria:`, JSON.stringify(searchCriteria));

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            console.log(`   📥 Attempt ${attempt}/${maxAttempts}...`);

            try {
                const result = await this._searchOnce(searchCriteria);
                if (result) {
                    return result;
                }

                if (attempt < maxAttempts) {
                    console.log(`   ⏳ Waiting ${delaySeconds}s before retry...`);
                    await this.delay(delaySeconds * 1000);
                }
            } catch (error) {
                console.error(`   ⚠️  Error on attempt ${attempt}:`, error.message);

                if (attempt < maxAttempts) {
                    console.log(`   🔄 Retrying in ${delaySeconds}s...`);
                    await this.delay(delaySeconds * 1000);
                } else {
                    throw new Error(`Failed after ${maxAttempts} attempts: ${error.message}`);
                }
            }
        }

        throw new Error('Email not found after maximum attempts');
    }

    _searchOnce(searchCriteria) {
        return new Promise((resolve, reject) => {
            const imap = new Imap(this.config);
            let resolved = false;

            const cleanup = () => {
                if (!resolved) {
                    resolved = true;
                    try {
                        imap.end();
                    } catch (e) {
                    }
                }
            };

            const timeoutId = setTimeout(() => {
                cleanup();
                reject(new Error('IMAP timeout'));
            }, 30000);

            imap.once('ready', () => {
                imap.openBox('INBOX', false, (err, box) => {
                    if (err) {
                        clearTimeout(timeoutId);
                        cleanup();
                        reject(err);
                        return;
                    }

                    console.log(`   📦 Inbox opened: ${box.messages.total} total messages`);

                    imap.search(searchCriteria, (err, results) => {
                        if (err) {
                            clearTimeout(timeoutId);
                            cleanup();
                            reject(err);
                            return;
                        }

                        if (!results || results.length === 0) {
                            console.log('   ⏳ No matching email found');
                            clearTimeout(timeoutId);
                            cleanup();
                            resolve(null);
                            return;
                        }

                        console.log(`   📧 Found ${results.length} matching email(s)`);

                        const latestEmailId = results[results.length - 1];
                        const fetch = imap.fetch([latestEmailId], {
                            bodies: '',
                            struct: true
                        });

                        let emailParsed = false;

                        fetch.on('message', (msg, seqno) => {
                            console.log(`   📖 Reading message #${seqno}...`);

                            msg.on('body', (stream, info) => {
                                simpleParser(stream, async (err, parsed) => {
                                    if (err) {
                                        console.error('   ⚠️  Parse error:', err.message);
                                        return;
                                    }

                                    if (emailParsed) return;
                                    emailParsed = true;

                                    console.log(`   📨 From: ${parsed.from?.text || 'unknown'}`);
                                    console.log(`   📝 Subject: ${parsed.subject || 'no subject'}`);

                                    clearTimeout(timeoutId);
                                    cleanup();
                                    resolve(parsed);
                                });
                            });

                            msg.once('error', (err) => {
                                console.error('   ⚠️  Message error:', err.message);
                            });
                        });

                        fetch.once('error', (err) => {
                            console.error('   ⚠️  Fetch error:', err.message);
                            clearTimeout(timeoutId);
                            cleanup();
                            reject(err);
                        });

                        fetch.once('end', () => {
                            setTimeout(() => {
                                if (!emailParsed && !resolved) {
                                    clearTimeout(timeoutId);
                                    cleanup();
                                    reject(new Error('Email fetch ended without result'));
                                }
                            }, 3000);
                        });
                    });
                });
            });

            imap.once('error', (err) => {
                console.error('   ⚠️  IMAP connection error:', err.message);
                clearTimeout(timeoutId);
                cleanup();
                reject(err);
            });

            imap.once('end', () => {
                console.log('   📪 IMAP connection ended');
            });

            try {
                console.log('   🔌 Connecting to IMAP...');
                imap.connect();
            } catch (error) {
                clearTimeout(timeoutId);
                cleanup();
                reject(error);
            }
        });
    }

    async getVerificationCode(fromDomain = 'luma', lookbackMinutes = 10, maxAttempts = 20, delaySeconds = 10) {
        const searchCriteria = [
            ['FROM', fromDomain],
            ['SINCE', new Date(Date.now() - lookbackMinutes * 60 * 1000)]
        ];

        const parsed = await this.searchEmail(searchCriteria, maxAttempts, delaySeconds);

        if (!parsed) {
            throw new Error('Email not found');
        }

        const content = (parsed.text || '') + (parsed.html || '');
        console.log('   📄 Email content length:', content.length);

        const patterns = [
            /\b(\d{6})\b/,
            /code[:\s]+(\d{6})/i,
            /verification[:\s]+(\d{6})/i,
            /(\d{6})/
        ];

        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match && match[1]) {
                console.log(`   ✅ Code found: ${match[1]} (pattern: ${pattern})`);
                return match[1];
            }
        }

        console.error('   ❌ No code found in email content');
        console.error('   📄 Content preview:', content.substring(0, 500));
        throw new Error('Verification code not found in email');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = EmailReader;
