# ⚡ Quick Start - Publish & Deploy

## 🎯 Ready to Publish!

Project sudah siap untuk di-publish dan di-deploy. Tidak ada error lagi!

---

## 📝 Environment Variables yang Diperlukan

Setelah publish, set environment variables berikut di platform hosting:

```env
CAPSOLVER_API_KEY=CAP-11B294FBD64B184D73AB1FC70535C80CEC62D5651DFC604641CC73E0D77EDEE8
TURNSTILE_KEY=0x4AAAAAAAWvh8EjxFMqgICc
PORT=3000
```

**Catatan:** `PORT` biasanya di-set otomatis oleh platform hosting.

---

## 🚀 Platform Hosting Options

### 1️⃣ Railway.app (Recommended)

**Gratis, unlimited execution time, perfect untuk long-running tasks!**

```bash
# Install CLI (sekali saja)
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up

# Set environment variables
railway variables set CAPSOLVER_API_KEY=CAP-xxx
railway variables set TURNSTILE_KEY=0x4AAAAAAAWvh8EjxFMqgICc
```

**URL:** Auto-generated, contoh: `https://luma-automation.up.railway.app`

---

### 2️⃣ Render.com

**Gratis, mudah setup via web UI**

1. Buka: https://render.com
2. New > Web Service
3. Connect GitHub atau upload ZIP
4. **Settings:**
   - Build Command: `npm install`
   - Start Command: `npm start`
5. **Environment:**
   - Add: `CAPSOLVER_API_KEY`
   - Add: `TURNSTILE_KEY`
6. Create Web Service

**URL:** Auto-generated, contoh: `https://luma-automation.onrender.com`

---

### 3️⃣ Bolt.new (Current Platform)

**Langsung publish dari Bolt!**

1. Click tombol **"Publish"** di atas
2. Project akan otomatis deployed
3. Setelah deployed, buka project settings
4. Add environment variables:
   - `CAPSOLVER_API_KEY`
   - `TURNSTILE_KEY`
5. Restart project

**URL:** Akan diberikan setelah publish

---

### 4️⃣ Heroku

```bash
# Login
heroku login

# Create app
heroku create luma-automation

# Set env vars
heroku config:set CAPSOLVER_API_KEY=CAP-xxx
heroku config:set TURNSTILE_KEY=0x4AAAAAAAWvh8EjxFMqgICc

# Deploy
git push heroku main
```

**URL:** `https://luma-automation.herokuapp.com`

---

## 📊 Setelah Deploy

### 1. Akses Web Interface

Buka URL yang diberikan, contoh:
```
https://your-app-name.railway.app
```

### 2. Test dengan 1-2 Email Dulu

Isi form dengan data test:

**Event URL:**
```
https://lu.ma/your-event
```

**Event API ID:** (cari di Network tab browser)
```
evt-xxxxxxxxxxxxx
```

**Emails:**
```json
[
  {
    "first_name": "Test",
    "last_name": "User",
    "email": "test1@yourdomain.com"
  }
]
```

### 3. Monitor Logs

**Railway:**
```bash
railway logs
```

**Render:**
- Dashboard > Your Service > Logs

**Heroku:**
```bash
heroku logs --tail
```

---

## ✅ Verification Checklist

Setelah deploy, check:

- [ ] Server berjalan tanpa error
- [ ] Web interface bisa dibuka
- [ ] API endpoint `/api/config` return correct config
- [ ] Test registration dengan 1 email berhasil
- [ ] Results muncul di tabel

---

## 🛠️ Troubleshooting

### Error: "CAPSOLVER_API_KEY missing"
**Fix:** Set environment variable di platform hosting

### Error: "Cannot find module"
**Fix:**
```bash
npm install
npm run build
```

### Server tidak bisa diakses
**Fix:**
- Check logs
- Pastikan PORT tidak di-hardcode
- Restart service

### Rate limit terus
**Fix:**
- Tunggu 30 menit
- Gunakan proxy/VPN
- Kurangi batch size ke 5 email

---

## 📞 Need Help?

1. Check logs di platform hosting
2. Test API endpoints manual:
   ```bash
   curl https://your-app.railway.app/api/config
   ```
3. Verify environment variables
4. Check `results.json` untuk error detail

---

## 🎉 Ready to Go!

Sekarang tinggal:
1. **Click "Publish"** atau **"Update"** di Bolt
2. Set environment variables
3. Buka URL & mulai register!

**Happy Automating! 🚀**
