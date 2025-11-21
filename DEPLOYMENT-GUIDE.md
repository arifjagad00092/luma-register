# 🚀 Deployment Guide - Luma Auto Register

## 📋 Overview

Script ini sekarang tersedia sebagai **Web API dengan GUI** yang bisa di-deploy ke berbagai platform cloud.

---

## 🎯 Cara Menjalankan Lokal

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Pastikan file `.env` sudah ada:

```env
CAPSOLVER_API_KEY=CAP-xxxxxxxxxxxxx
TURNSTILE_KEY=0x4AAAAAAAWvh8EjxFMqgICc
```

### 3. Start Server

```bash
npm start
```

Server akan berjalan di: **http://localhost:3000**

---

## 🌐 Deploy ke Platform Cloud

### Option 1: Railway.app (Recommended - Gratis)

1. **Sign up di Railway:**
   - Buka https://railway.app
   - Login dengan GitHub

2. **Deploy:**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login
   railway login

   # Deploy
   railway up
   ```

3. **Set Environment Variables:**
   - Buka Railway Dashboard
   - Pilih project Anda
   - Tab "Variables"
   - Tambahkan:
     - `CAPSOLVER_API_KEY=CAP-xxxxxxxxxxxxx`
     - `TURNSTILE_KEY=0x4AAAAAAAWvh8EjxFMqgICc`

4. **Done!** Railway akan memberikan URL public.

---

### Option 2: Render.com (Gratis)

1. **Sign up di Render:**
   - Buka https://render.com
   - Login dengan GitHub

2. **Create Web Service:**
   - Dashboard > New > Web Service
   - Connect GitHub repository
   - Atau upload project sebagai ZIP

3. **Configure:**
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables:**
     - `CAPSOLVER_API_KEY=CAP-xxxxxxxxxxxxx`
     - `TURNSTILE_KEY=0x4AAAAAAAWvh8EjxFMqgICc`

4. **Deploy!**

---

### Option 3: Heroku

1. **Install Heroku CLI:**
   ```bash
   npm install -g heroku
   ```

2. **Login & Create App:**
   ```bash
   heroku login
   heroku create luma-autoregister
   ```

3. **Set Environment Variables:**
   ```bash
   heroku config:set CAPSOLVER_API_KEY=CAP-xxxxxxxxxxxxx
   heroku config:set TURNSTILE_KEY=0x4AAAAAAAWvh8EjxFMqgICc
   ```

4. **Deploy:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push heroku main
   ```

---

### Option 4: Vercel (Serverless)

⚠️ **Catatan:** Vercel cocok untuk API, tapi ada timeout 10s untuk free tier.

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Set Environment Variables:**
   ```bash
   vercel env add CAPSOLVER_API_KEY
   vercel env add TURNSTILE_KEY
   ```

4. **Redeploy:**
   ```bash
   vercel --prod
   ```

---

## 🖥️ Menggunakan Web Interface

### 1. Buka Browser

Akses URL deployment Anda atau `http://localhost:3000`

### 2. Isi Form:

**Event URL:**
```
https://lu.ma/your-event
```

**Event API ID:**
```
evt-xxxxxxxxxxxxx
```

**Turnstile Key:** (Optional - default dari .env)
```
0x4AAAAAAAWvh8EjxFMqgICc
```

**Emails (JSON):**
```json
[
  {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john1@example.com"
  },
  {
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane1@example.com"
  }
]
```

### 3. Click "Start Registration"

- Progress akan update real-time
- Status setiap email akan muncul di tabel results
- Bisa di-stop kapan saja

---

## 📡 API Endpoints

### 1. **GET /** - Web Interface
Web GUI untuk manage registrations

### 2. **POST /api/register/start** - Start Registration

**Request Body:**
```json
{
  "eventUrl": "https://lu.ma/your-event",
  "eventApiId": "evt-xxxxxxxxxxxxx",
  "emails": [
    {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com"
    }
  ],
  "turnstileKey": "0x4AAAAAAAWvh8EjxFMqgICc"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration started",
  "status": {
    "isRunning": true,
    "currentIndex": 0,
    "totalEmails": 1
  }
}
```

### 3. **GET /api/status** - Get Current Status

**Response:**
```json
{
  "isRunning": true,
  "currentIndex": 5,
  "totalEmails": 10,
  "results": [...],
  "startedAt": "2025-11-21T04:00:00Z",
  "completedAt": null
}
```

### 4. **POST /api/register/stop** - Stop Registration

**Response:**
```json
{
  "success": true,
  "message": "Registration stopped"
}
```

### 5. **GET /api/results** - Get All Results

**Response:**
```json
[
  {
    "success": true,
    "email": "john@example.com",
    "timestamp": "2025-11-21T04:05:00Z",
    "alreadyRegistered": false
  }
]
```

### 6. **GET /api/config** - Get Configuration

**Response:**
```json
{
  "capsolverConfigured": true,
  "defaultTurnstileKey": "0x4AAAAAAAWvh8EjxFMqgICc"
}
```

---

## 🔐 Security Notes

### Environment Variables
- **NEVER** commit `.env` file
- `.env` sudah di `.gitignore`
- Set env vars di platform hosting

### Rate Limiting
Server sudah implement:
- Random delay 8-15 detik antar email
- Auto-retry dengan 60s cooldown
- Random User-Agent rotation

---

## 📊 Monitoring

### Logs

**Railway/Render:**
- Lihat logs real-time di dashboard

**Heroku:**
```bash
heroku logs --tail
```

### Status Endpoint

Check status dari terminal:
```bash
curl https://your-app.railway.app/api/status
```

---

## 🐛 Troubleshooting

### Error: "CAPSOLVER_API_KEY missing"
**Solusi:** Set environment variable di platform hosting

### Error: "additional-verification-required"
**Solusi:**
- Script akan auto-retry setelah 60s
- Jika masih gagal, tunggu 30 menit atau ganti IP

### Server timeout di Vercel
**Solusi:** Gunakan Railway atau Render yang support long-running process

### Can't connect to server
**Solusi:**
- Check logs di dashboard
- Pastikan PORT env var tidak di-set (auto dari platform)

---

## 💡 Tips

### Best Practice:
1. ✅ Deploy di Railway (unlimited execution time)
2. ✅ Register max 10 email per batch
3. ✅ Monitor via web interface
4. ✅ Check results real-time

### Untuk Production:
1. Add authentication (basic auth atau JWT)
2. Add database untuk persistent storage
3. Add webhook notifications (Discord/Telegram)
4. Add retry queue untuk failed registrations

---

## 📞 Support

Jika ada masalah:
1. Check logs di platform hosting
2. Check `results.json` file
3. Verify `.env` variables
4. Test dengan 1-2 email dulu

---

**Happy Deploying! 🚀**
