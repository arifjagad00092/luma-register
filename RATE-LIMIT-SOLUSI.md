# 🛡️ Solusi Rate Limiting & Additional Verification

## ❌ Masalah
Error: **"auth/additional-verification-required"**

Luma.ai mendeteksi aktivitas mencurigakan dan memblokir registrasi otomatis karena:
1. User-Agent yang terlalu robotik
2. Request pattern yang terlalu cepat/repetitive
3. Kurangnya browser fingerprinting yang proper
4. Terlalu banyak request dari IP yang sama

---

## ✅ Solusi yang Sudah Diterapkan

### 1. **Random User-Agent Pool**
Script sekarang menggunakan 5 User-Agent berbeda yang di-rotate random:
- Chrome Windows
- Chrome MacOS
- Safari MacOS
- Firefox Windows

### 2. **Enhanced Browser Headers**
Ditambahkan headers yang lebih realistic:
- `Sec-Ch-Ua`, `Sec-Ch-Ua-Mobile`, `Sec-Ch-Ua-Platform`
- `Sec-Fetch-Dest`, `Sec-Fetch-Mode`, `Sec-Fetch-Site`
- `Accept-Encoding: gzip, deflate, br, zstd`
- `X-Luma-Client: web`

### 3. **Random Delay (8-15 detik)**
Setiap registrasi memiliki delay acak 8-15 detik untuk menghindari pattern detection.

### 4. **Auto-Retry dengan 60s Cooldown**
Jika terdeteksi rate limit, script akan:
- Otomatis tunggu 60 detik
- Retry sekali lagi
- Jika masih gagal, skip ke email berikutnya

---

## 🚀 Cara Menggunakan

### Method 1: Tunggu Rate Limit Hilang
```bash
# Tunggu 10-30 menit, lalu run lagi
node luma-register.js
```

### Method 2: Gunakan Proxy/VPN
Jika kena rate limit terus-menerus, gunakan IP berbeda:

```bash
# Set proxy di environment
export HTTP_PROXY=http://your-proxy:port
export HTTPS_PROXY=http://your-proxy:port

node luma-register.js
```

### Method 3: Batch Kecil
Jangan register terlalu banyak sekaligus:

```javascript
// Di email.json - register max 5-10 email per batch
[
  { "first_name": "John", "last_name": "Doe", "email": "john1@..." },
  { "first_name": "Jane", "last_name": "Doe", "email": "jane1@..." }
  // Max 5-10 emails
]
```

---

## 📊 Monitoring

Script akan menampilkan log detail:

```
✅ Registration successful!          → Berhasil
📋 Response preview: {...}           → Preview response

⚠️  403 Response received            → Blocked
🛡️  Additional verification required → Rate limited
⏸️  Waiting 60s before retry...     → Auto retry

ℹ️  Email already registered        → Skip (sudah register)
```

---

## 💡 Tips Menghindari Rate Limit

### ✅ DO:
- Gunakan delay minimal 8-15 detik antar registrasi
- Register max 10 email per batch
- Gunakan IP/proxy berbeda jika kena rate limit
- Tunggu 30 menit sebelum batch berikutnya

### ❌ DON'T:
- Register puluhan email sekaligus tanpa delay
- Gunakan delay < 5 detik
- Retry terlalu cepat setelah kena rate limit
- Gunakan User-Agent yang sama untuk semua request

---

## 🔍 Troubleshooting

### Error: "additional-verification-required"
**Penyebab:** Luma mendeteksi bot activity

**Solusi:**
1. Tunggu 30-60 menit
2. Gunakan IP/VPN berbeda
3. Kurangi jumlah email per batch

### Semua Email Kena Rate Limit
**Penyebab:** IP sudah di-blacklist sementara

**Solusi:**
1. Tunggu 1-2 jam
2. Restart router untuk dapat IP baru (jika dynamic)
3. Gunakan proxy/VPN

### Rate Limit Setelah 2-3 Email
**Penyebab:** Rate limit threshold sangat ketat

**Solusi:**
1. Increase delay ke 20-30 detik: edit line 536
   ```javascript
   const delay = Math.floor(Math.random() * 11) + 20; // 20-30s
   ```
2. Register 2-3 email, tunggu 1 jam, lanjut lagi

---

## 🎯 Best Practice

**Untuk 100 email:**
1. **Day 1:** Register 10 email (delay 10s) → Tunggu 2 jam
2. **Day 1:** Register 10 email lagi → Done for today
3. **Day 2:** Continue dengan 10 email per session
4. **Total:** 5 hari untuk 100 email (aman & no rate limit)

**Untuk 10-20 email:**
1. Register semua sekaligus dengan delay 8-15s
2. Jika kena rate limit di tengah, script auto retry
3. Total waktu: ~30-45 menit untuk 20 email
