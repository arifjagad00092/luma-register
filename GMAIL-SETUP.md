# Setup Gmail untuk IMAP

## Masalah Umum: IMAP Tidak Bisa Membaca Email

Jika IMAP tidak bisa membaca email dari Gmail, ikuti langkah-langkah berikut:

## 1. Enable 2-Step Verification (Wajib)

1. Buka: https://myaccount.google.com/security
2. Scroll ke "2-Step Verification"
3. Klik "Get started" atau "Turn on"
4. Ikuti instruksi untuk mengaktifkan 2FA

**PENTING:** App Password hanya bisa dibuat jika 2-Step Verification sudah aktif!

## 2. Generate App Password (Bukan Password Biasa!)

### Langkah-langkah:

1. Buka: https://myaccount.google.com/apppasswords

   Atau manual:
   - Buka https://myaccount.google.com
   - Klik "Security" di sidebar kiri
   - Scroll ke bawah ke "2-Step Verification"
   - Klik "App passwords" (di bagian bawah section 2-Step Verification)

2. Login jika diminta

3. Pilih app: **Mail**
4. Pilih device: **Other (Custom name)**
5. Ketik nama: **Luma Bot** atau apa saja
6. Klik "Generate"

7. Copy 16-karakter password yang muncul (format: xxxx xxxx xxxx xxxx)
   **PENTING:** Simpan password ini, tidak bisa dilihat lagi!

8. Paste ke `.env` sebagai `EMAIL_PASSWORD` (tanpa spasi):

```env
EMAIL_USER=youremail@gmail.com
EMAIL_PASSWORD=xxxxxxxxxxxxxxxx
```

## 3. Enable IMAP di Gmail

1. Buka Gmail: https://mail.google.com
2. Klik ⚙️ (Settings) di kanan atas
3. Klik "See all settings"
4. Tab "Forwarding and POP/IMAP"
5. Section "IMAP access":
   - Pilih **"Enable IMAP"**
6. Scroll ke bawah, klik "Save Changes"

## 4. Test IMAP Connection

Jalankan script test:

```bash
node test-imap.js
```

**Output yang diharapkan jika berhasil:**

```
✅ Email found!
   From: Luma <noreply@lu.ma>
   Subject: Your sign in code
   Date: ...

   ✅ Found code: 123456
```

**Jika gagal:**

```
❌ IMAP connection error: Invalid credentials
```

→ App Password salah, generate ulang

```
❌ IMAP connection error: ECONNREFUSED
```

→ IMAP tidak enabled, cek Settings Gmail

## 5. Common Errors & Solutions

### Error: "Invalid credentials (Failure)"

**Penyebab:**
- App Password salah
- Menggunakan password biasa (bukan App Password)
- Ada spasi di App Password

**Solusi:**
1. Generate App Password baru
2. Copy-paste ke `.env` tanpa spasi
3. Pastikan tidak ada quote di password: `EMAIL_PASSWORD=abcd1234efgh5678` ✅ bukan `EMAIL_PASSWORD="abcd1234efgh5678"` ❌

### Error: "ECONNREFUSED" atau "Connection timeout"

**Penyebab:**
- IMAP tidak enabled di Gmail
- Firewall memblokir port 993

**Solusi:**
1. Enable IMAP di Gmail Settings (lihat langkah 3)
2. Cek firewall/antivirus
3. Coba jaringan lain jika menggunakan corporate network

### Error: "Too many simultaneous connections"

**Penyebab:**
- Terlalu banyak koneksi IMAP aktif

**Solusi:**
1. Tunggu beberapa menit
2. Close aplikasi email lain yang menggunakan IMAP
3. Restart router/modem

### Email ditemukan tapi "No code found"

**Penyebab:**
- Format email dari Luma berbeda
- Code tidak dalam format 6 digit

**Solusi:**
1. Jalankan `node test-imap.js` untuk lihat content email
2. Cek format code di email
3. Update regex pattern di `email-reader.js` jika perlu

## 6. Alternative: Yahoo Mail atau Outlook

Jika Gmail tidak bisa, bisa pakai email provider lain:

### Yahoo Mail:

```env
EMAIL_USER=yourname@yahoo.com
EMAIL_PASSWORD=your_app_password
```

Config di code:
```javascript
host: 'imap.mail.yahoo.com',
port: 993
```

Generate App Password: https://login.yahoo.com/account/security

### Outlook/Hotmail:

```env
EMAIL_USER=yourname@outlook.com
EMAIL_PASSWORD=your_password
```

Config di code:
```javascript
host: 'outlook.office365.com',
port: 993
```

**Note:** Outlook mungkin perlu "Allow less secure apps" enabled.

## 7. Testing Flow

### Test 1: IMAP Connection
```bash
node test-imap.js
```

Harus berhasil connect dan bisa baca email lama dari Luma (jika ada).

### Test 2: Single Registration
```bash
node test-single.js
```

Akan test full flow: register → email → extract code → sign in

### Test 3: Batch Processing
```bash
node luma-register.js
```

Process semua user di `email.json`.

## Checklist Troubleshooting

- [ ] 2-Step Verification enabled?
- [ ] App Password generated (bukan password biasa)?
- [ ] App Password di `.env` tanpa spasi?
- [ ] IMAP enabled di Gmail Settings?
- [ ] `node test-imap.js` berhasil?
- [ ] Ada email dari Luma di inbox (untuk test)?
- [ ] Firewall tidak blocking port 993?

Jika semua ✅ tapi masih error, coba:
1. Generate App Password baru
2. Restart terminal/command prompt
3. Cek `.env` file di folder yang sama dengan script
4. Run dengan `node test-imap.js` untuk debug detail

## Support

Jika masih error, jalankan dan kirim output:

```bash
node test-imap.js 2>&1 | tee imap-debug.log
```

Akan generate file `imap-debug.log` dengan detail error.
