# Luma Auto Register

Bot otomatis untuk registrasi event Luma.lu dengan dukungan Cloudflare Turnstile menggunakan CapSolver.

## Fitur

- Registrasi otomatis ke event Luma
- Support Cloudflare Turnstile challenge
- Verifikasi email otomatis via Gmail
- Batch processing multiple users
- Retry logic dan error handling

## Instalasi

```bash
npm install
```

## Konfigurasi

### 1. File `.env`

Buat atau edit file `.env`:

```env
EMAIL_USER=youremail@gmail.com
EMAIL_PASSWORD=your_app_password
CAPSOLVER_API_KEY=CAP-XXXXXXXXXX
TURNSTILE_KEY=0x4XXXXXXXXXX
```

**Penting untuk Gmail:**
- Gunakan **App Password**, bukan password biasa
- Cara membuat: Google Account > Security > 2-Step Verification > App passwords
- Atau gunakan: https://myaccount.google.com/apppasswords

### 2. File `email.json`

Format file untuk daftar user:

```json
[
  {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@gmail.com"
  },
  {
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane.smith@gmail.com"
  }
]
```

### 3. Update Event Details

Edit file `luma-register.js` pada bagian constructor:

```javascript
this.eventApiId = 'evt-XXXXXXXXXX';
this.ticketTypeId = 'evtticktyp-XXXXXXXXXX';
this.eventURL = 'https://lu.ma/your-event';
```

**Cara mendapatkan Event Details:**

1. Buka event page di browser
2. Buka DevTools (F12) > Network tab
3. Klik tombol Register
4. Lihat request ke `/event/register`
5. Copy `event_api_id` dan `ticket_type_to_selection` key

## Mendapatkan Turnstile Key

Jika Luma memerlukan Turnstile challenge:

1. Buka event page di browser
2. Buka DevTools (F12) > Network tab
3. Refresh page
4. Cari request yang mengandung "turnstile" atau "challenges.cloudflare.com"
5. Lihat query parameter `sitekey` atau cari di HTML: `data-sitekey="0x4XXXXXXXXXX"`
6. Masukkan ke `.env` sebagai `TURNSTILE_KEY`

## Cara Menjalankan

### Test dengan 1 user:

Edit bagian paling bawah `luma-register.js`, ubah `processBatch` menjadi `processRegistration`:

```javascript
const bot = new LumaAutoRegister();
bot.processRegistration('John', 'Doe', 'john.doe@gmail.com', turnstileKey)
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Error:', error.message);
        process.exit(1);
    });
```

Lalu jalankan:

```bash
node luma-register.js
```

### Batch processing:

```bash
node luma-register.js
```

Akan memproses semua user di `email.json`.

## Hasil

Hasil akan disimpan di `results.json`:

```json
[
  {
    "success": true,
    "email": "john.doe@gmail.com",
    "authToken": "xxx",
    "timestamp": "2025-11-20T10:30:00.000Z"
  },
  {
    "success": false,
    "email": "jane.smith@gmail.com",
    "error": "Email not received",
    "timestamp": "2025-11-20T10:35:00.000Z"
  }
]
```

## Troubleshooting

### Error: CAPSOLVER_API_KEY missing

Pastikan file `.env` berisi `CAPSOLVER_API_KEY=CAP-XXXXXXXXXX`

### Error: EMAIL credentials missing

Pastikan `.env` berisi:
- `EMAIL_USER=youremail@gmail.com`
- `EMAIL_PASSWORD=your_app_password`

### Error: Inbox error / IMAP connection failed

1. Pastikan menggunakan **App Password**, bukan password biasa
2. Pastikan 2FA enabled di Gmail
3. Pastikan "Less secure app access" tidak dimatikan (tidak diperlukan jika pakai App Password)

### Error: Turnstile required but no websiteKey provided

1. Cari Turnstile key di DevTools (lihat panduan di atas)
2. Tambahkan ke `.env`: `TURNSTILE_KEY=0x4XXXXXXXXXX`

### Error: Email not received

1. Cek spam folder
2. Tunggu lebih lama (default: 20 attempts x 10s = 200s)
3. Cek apakah email dari Luma masuk ke inbox

### API returns 403 Forbidden

1. Turnstile challenge detected
2. Pastikan `TURNSTILE_KEY` sudah di-set
3. Pastikan CapSolver balance cukup

### Registration successful tapi tidak ada konfirmasi

Cek inbox email yang didaftarkan, seharusnya ada email dari Luma dengan QR code atau link konfirmasi.

## Biaya

CapSolver pricing untuk Turnstile:
- ~$0.003 per solve
- Untuk 100 user = ~$0.30

## Catatan Penting

- Jangan spam! Tambahkan delay antar registrasi (default: 30-60 detik)
- Setiap Gmail hanya bisa registrasi 1 kali per event
- Pastikan CapSolver balance cukup
- Script akan berhenti jika ada error fatal

## Lisensi

Gunakan dengan bijak dan sesuai Terms of Service Luma.
