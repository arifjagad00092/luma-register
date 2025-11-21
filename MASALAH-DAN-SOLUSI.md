# Masalah: IMAP Tidak Bisa Membaca Email

## Status Saat Ini

✅ Dependencies terinstall
✅ CapSolver API Key configured
✅ Email credentials ada di .env
❌ **IMAP Connection Failed: Invalid credentials**

## Penyebab Masalah

Password `jagad282898` di `.env` adalah **password Gmail biasa**, bukan **App Password**.

Gmail **TIDAK MENGIZINKAN** aplikasi eksternal login dengan password biasa karena alasan keamanan.

## Solusi: Generate App Password

### Langkah 1: Enable 2-Step Verification

1. Buka: https://myaccount.google.com/security
2. Cari "2-Step Verification"
3. Klik "Turn on" jika belum aktif
4. Ikuti instruksi (biasanya pakai nomor HP)

**PENTING:** Tanpa 2-Step Verification, Anda tidak bisa membuat App Password!

### Langkah 2: Generate App Password

1. Setelah 2-Step Verification aktif, buka: https://myaccount.google.com/apppasswords

2. Jika diminta login lagi, masukkan password Gmail biasa

3. Di halaman App Passwords:
   - Select app: **Mail**
   - Select device: **Other (Custom name)**
   - Ketik nama: **Luma Bot**
   - Klik "Generate"

4. Akan muncul 16-karakter password seperti ini:
   ```
   abcd efgh ijkl mnop
   ```

5. **COPY password ini** (tanpa spasi): `abcdefghijklmnop`

### Langkah 3: Update .env

Edit file `.env`, ganti `EMAIL_PASSWORD`:

**SEBELUM:**
```env
EMAIL_USER=dikywahyudi01821@gmail.com
EMAIL_PASSWORD=jagad282898
```

**SESUDAH:**
```env
EMAIL_USER=dikywahyudi01821@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
```

(Ganti `abcdefghijklmnop` dengan App Password yang Anda generate)

### Langkah 4: Enable IMAP di Gmail

1. Buka Gmail: https://mail.google.com
2. Klik ⚙️ Settings (pojok kanan atas)
3. Klik "See all settings"
4. Tab "Forwarding and POP/IMAP"
5. Pilih **"Enable IMAP"**
6. Scroll ke bawah, klik "Save Changes"

### Langkah 5: Test Lagi

```bash
node test-imap.js
```

Seharusnya sekarang berhasil!

## Kalau Masih Gagal

### Error: "App Passwords tidak tersedia"

**Penyebab:** 2-Step Verification belum aktif

**Solusi:** Aktifkan 2-Step Verification dulu (Langkah 1)

### Error: Tetap "Invalid credentials" setelah pakai App Password

**Penyebab:**
- Ada spasi di App Password
- Copy-paste tidak lengkap

**Solusi:**
1. Pastikan App Password di `.env` 16 karakter, tanpa spasi
2. Tidak pakai quote: `EMAIL_PASSWORD=abcd1234efgh5678` ✅
3. Generate App Password baru jika perlu

### Error: "Too many failed login attempts"

**Penyebab:** Terlalu banyak coba login dengan password salah

**Solusi:**
1. Tunggu 15-30 menit
2. Cek email Gmail, mungkin ada notifikasi "Suspicious sign in prevented"
3. Klik "Yes, it was me" di email tersebut
4. Try again

## Setelah IMAP Berhasil

Setelah `node test-imap.js` berhasil, baru jalankan:

1. **Test single user:**
   ```bash
   node test-single.js
   ```

2. **Batch processing:**
   ```bash
   node luma-register.js
   ```

## Diagram Flow

```
1. User Request Register
   ↓
2. API Register (mungkin perlu Turnstile)
   ↓
3. API Send Sign-in Code
   ↓
4. 📧 LUMA KIRIM EMAIL KE GMAIL ← Anda di sini!
   ↓
5. 🔍 IMAP BACA EMAIL ← ERROR: Invalid credentials
   ↓
6. Extract code dari email
   ↓
7. API Sign In dengan code
   ↓
8. ✅ Success
```

**Masalah Anda:** Step 5 gagal karena IMAP tidak bisa login ke Gmail.

**Solusi:** Pakai App Password (bukan password biasa).

## Quick Fix Summary

```bash
# 1. Enable 2FA di Gmail
https://myaccount.google.com/security

# 2. Generate App Password
https://myaccount.google.com/apppasswords

# 3. Copy 16-digit password (tanpa spasi)

# 4. Update .env
EMAIL_PASSWORD=your_16_digit_app_password_here

# 5. Enable IMAP di Gmail Settings

# 6. Test
node test-imap.js

# 7. Jika berhasil, run full test
node test-single.js
```

## Pertanyaan Umum

**Q: Apakah App Password aman?**
A: Ya! Lebih aman dari password biasa karena:
- Hanya bisa untuk 1 aplikasi
- Bisa di-revoke kapan saja tanpa ganti password Gmail
- Tidak bisa dipakai untuk login Gmail di browser

**Q: Apakah harus pakai App Password?**
A: Ya, Gmail wajib pakai App Password untuk IMAP sejak 2022.

**Q: Bisa pakai email lain selain Gmail?**
A: Bisa! Yahoo Mail, Outlook, dll. Tapi Gmail paling mudah setup-nya.

**Q: Code sudah masuk tapi IMAP tidak baca?**
A: Jalankan `node test-imap.js` dulu untuk pastikan IMAP bisa connect dan baca email lama dari Luma (kalau ada).
