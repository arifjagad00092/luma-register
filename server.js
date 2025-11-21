require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let registrationStatus = {
    isRunning: false,
    currentIndex: 0,
    totalEmails: 0,
    results: [],
    startedAt: null,
    completedAt: null
};

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/status', (req, res) => {
    res.json(registrationStatus);
});

app.post('/api/register/start', async (req, res) => {
    try {
        if (registrationStatus.isRunning) {
            return res.status(400).json({
                error: 'Registration already in progress'
            });
        }

        const { eventUrl, eventApiId, emails, turnstileKey } = req.body;

        if (!eventUrl || !eventApiId || !emails || !Array.isArray(emails)) {
            return res.status(400).json({
                error: 'Missing required fields: eventUrl, eventApiId, emails'
            });
        }

        await fs.writeFile('email.json', JSON.stringify(emails, null, 2));

        const LumaRegister = require('./luma-register.js');
        const lumaRegister = new LumaRegister(
            eventUrl,
            eventApiId,
            turnstileKey || process.env.TURNSTILE_KEY
        );

        registrationStatus = {
            isRunning: true,
            currentIndex: 0,
            totalEmails: emails.length,
            results: [],
            startedAt: new Date().toISOString(),
            completedAt: null
        };

        res.json({
            success: true,
            message: 'Registration started',
            status: registrationStatus
        });

        (async () => {
            try {
                const results = await lumaRegister.batchRegister(emails, turnstileKey);
                registrationStatus.results = results;
                registrationStatus.isRunning = false;
                registrationStatus.completedAt = new Date().toISOString();
            } catch (error) {
                console.error('Batch registration error:', error);
                registrationStatus.isRunning = false;
                registrationStatus.error = error.message;
                registrationStatus.completedAt = new Date().toISOString();
            }
        })();

    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

app.post('/api/register/stop', (req, res) => {
    if (!registrationStatus.isRunning) {
        return res.status(400).json({
            error: 'No registration in progress'
        });
    }

    registrationStatus.isRunning = false;
    registrationStatus.completedAt = new Date().toISOString();

    res.json({
        success: true,
        message: 'Registration stopped',
        status: registrationStatus
    });
});

app.get('/api/results', async (req, res) => {
    try {
        const resultsFile = path.join(__dirname, 'results.json');
        const fileExists = await fs.access(resultsFile).then(() => true).catch(() => false);

        if (!fileExists) {
            return res.json([]);
        }

        const data = await fs.readFile(resultsFile, 'utf8');
        const results = JSON.parse(data);
        res.json(results);
    } catch (error) {
        console.error('Error reading results:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

app.get('/api/config', (req, res) => {
    res.json({
        capsolverConfigured: !!process.env.CAPSOLVER_API_KEY,
        defaultTurnstileKey: process.env.TURNSTILE_KEY || null
    });
});

app.listen(PORT, () => {
    console.log('='.repeat(70));
    console.log('🚀 Luma Auto Register API Server');
    console.log('='.repeat(70));
    console.log(`📡 Server running on: http://localhost:${PORT}`);
    console.log(`🔑 CapSolver API Key: ${process.env.CAPSOLVER_API_KEY ? 'Configured ✅' : 'Missing ❌'}`);
    console.log(`🎯 Default Turnstile Key: ${process.env.TURNSTILE_KEY || 'Not set'}`);
    console.log('='.repeat(70));
    console.log('');
    console.log('📚 API Endpoints:');
    console.log('  GET  /                      - Web Interface');
    console.log('  GET  /api/status            - Current registration status');
    console.log('  POST /api/register/start    - Start batch registration');
    console.log('  POST /api/register/stop     - Stop registration');
    console.log('  GET  /api/results           - Get results');
    console.log('  GET  /api/config            - Get configuration');
    console.log('='.repeat(70));
});
