# Cara Mencari Turnstile Key dari Luma

## Status Saat Ini

✅ **IMAP berhasil!** Email sudah bisa dibaca dengan `node-imap`
✅ App Password sudah benar
❌ Masih perlu **Turnstile Key** untuk bypass Cloudflare

## Apa itu Turnstile Key?

Turnstile adalah captcha dari Cloudflare yang digunakan Luma untuk proteksi spam. Key ini diperlukan agar CapSolver bisa solve challenge.

## Cara 1: Via Browser DevTools (Paling Mudah)

### Langkah-langkah:

1. **Buka event Luma di browser:**
   ```
   https://lu.ma/halfbakedhackathon
   ```

2. **Buka DevTools:**
   - Windows/Linux: Tekan `F12` atau `Ctrl+Shift+I`
   - Mac: `Cmd+Option+I`

3. **Ke tab Network:**
   - Klik tab "Network" di DevTools
   - Centang "Preserve log"

4. **Coba register:**
   - Isi form registrasi di Luma
   - Klik tombol "Register" atau "RSVP"

5. **Cari request `/event/register`:**
   - Di tab Network, filter dengan "register"
   - Klik request ke `api2.luma.com/event/register`

6. **Lihat Headers atau Payload:**
   - Tab "Headers": Cari `cf-turnstile-response` atau `turnstile-token`
   - Tab "Payload": Cari field yang mengandung "turnstile"

## Cara 2: Via Page Source

1. **Buka event Luma:**
   ```
   https://lu.ma/halfbakedhackathon
   ```

2. **View page source:**
   - Windows/Linux: `Ctrl+U`
   - Mac: `Cmd+Option+U`

3. **Search untuk turnstile:**
   - `Ctrl+F` / `Cmd+F`
   - Cari: `turnstile` atau `data-sitekey` atau `cf-turnstile`

4. **Copy key:**
   - Key biasanya berbentuk: `0x4AAAAAAAxxxxxxxxxx`
   - Contoh: `0x4AAAAAAA9rN0jZtHEJ` atau `0x4AAAAAAA...`

## Cara 3: Via Console JavaScript

1. **Buka event Luma di browser**

2. **Buka Console:**
   - `F12` > tab "Console"

3. **Run JavaScript:**
   ```javascript
   // Cari di script tags
   Array.from(document.scripts).forEach(s => {
       if (s.innerHTML.includes('turnstile')) {
           console.log(s.innerHTML);
       }
   });

   // Cari di data attributes
   document.querySelectorAll('[data-sitekey]').forEach(el => {
       console.log('Found sitekey:', el.getAttribute('data-sitekey'));
   });

   // Cari Turnstile widget
   const turnstile = document.querySelector('[id*="turnstile"]') ||
                     document.querySelector('[class*="turnstile"]');
   if (turnstile) console.log('Turnstile element:', turnstile);
   ```

4. **Copy key dari output**

## Cara 4: Intercept dengan Burp Suite / Fiddler (Advanced)

Jika menggunakan proxy tools:

1. Setup Burp/Fiddler
2. Buka Luma dan register
3. Intercept request ke `api2.luma.com/event/register`
4. Lihat header `cf-turnstile-response` atau body params
5. Atau lihat request ke `challenges.cloudflare.com` yang include sitekey

## Format Turnstile Key

Turnstile key biasanya berbentuk:

```
0x4AAAAAAA9rN0jZtHEJ          <- Cloudflare Turnstile
0x4AAAAAAA...                  <- Format umum
1x00000000000000000000AA       <- Alternate format
```

**Bukan** seperti ini:
```
❌ CAP-xxxxx (ini CapSolver API key)
❌ xxx-xxxxx-xxx (ini reCAPTCHA key)
```

## Setelah Dapat Key

1. **Update .env:**
   ```env
   TURNSTILE_KEY=0x4AAAAAAA9rN0jZtHEJ
   ```

2. **Test:**
   ```bash
   node test-single.js
   ```

3. **Jika berhasil, batch:**
   ```bash
   node luma-register.js
   ```

## Alternatif: Register Tanpa Turnstile

Jika Turnstile tidak terdeteksi atau tidak diperlukan:

### Option 1: Coba langsung tanpa key

Kadang Luma tidak selalu pakai Turnstile. Coba dulu:

```bash
node test-single.js
```

Jika error "Turnstile required" baru cari key.

### Option 2: Pakai request dari browser

1. Register 1 user manual di browser
2. Copy semua cookies dari DevTools > Application > Cookies
3. Update script untuk pakai cookies tersebut

## Troubleshooting

### "Turnstile required but no websiteKey provided"

✅ Ini error yang Anda alami sekarang
→ Perlu cari Turnstile key dengan cara di atas

### "CapSolver failed: Invalid websiteKey"

→ Key salah format atau expired
→ Cari key terbaru dari website

### "CapSolver failed: Insufficient balance"

→ Top up CapSolver account
→ Cek balance: https://dashboard.capsolver.com

### Tidak bisa menemukan key di mana-mana

Kemungkinan:
1. Luma tidak pakai Turnstile untuk event ini
2. Turnstile hanya muncul setelah beberapa kali failed attempts
3. Turnstile di-load via JavaScript async

Solusi:
- Coba register 2-3 kali dulu manual
- Baru check DevTools lagi
- Atau gunakan cara Intercept dengan proxy

## Biaya CapSolver untuk Turnstile

- ~$0.003 per solve
- 100 registrations = ~$0.30
- 1000 registrations = ~$3.00

Pastikan balance cukup sebelum batch processing!

## Contact & Help

Jika masih stuck, kirim screenshot:
1. DevTools > Network tab saat register
2. Error message dari terminal
3. `.env` file (sembunyikan password dan API key!)
