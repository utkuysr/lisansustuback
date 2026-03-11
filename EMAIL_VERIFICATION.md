# Email Verification Sistemi

## Özet

Email verification sistemi, kullanıcıların email adreslerini doğrulamalarını sağlar. İşlem şu şekilde çalışır:

1. Kullanıcı `/auth/send-verification-code` endpoint'ine email adresini gönderir
2. Sistem 6 haneli rastgele bir code generate eder
3. Code'u kullanıcının email adresine gönderir (15 dakika geçerli)
4. Kullanıcı aldığı code'u `/auth/verify-email` endpoint'ine gönderir
5. Code doğrulanırsa email `isEmailVerified: true` olur

## Database Columns

User entity'ye iki yeni sütun eklendi:

```sql
- verification_code (VARCHAR(10), nullable) - 6 haneli verification code
- verification_code_expires_at (TIMESTAMP, nullable) - Code'un süresi bitme zamanı
```

## Environment Variables

Email göndermek için SMTP ayarlarını `.env` dosyasında konfigüre et:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@example.com
```

### Gmail Ayarı (Örnek)

1. Google Account ayarlarını aç
2. "Security" kısmından "App Passwords" oluştur
3. **SMTP_PASSWORD** olarak bu app password'ı kullan
4. **SMTP_USER** olarak Gmail adresini kullan

### Alternative Email Providers

**Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxxxxxxxxxxxx
```

**AWS SES:**
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
```

## Workflow

### Verification Code Gönderme

1. **Request:**
```bash
POST /auth/send-verification-code
{
  "email": "john@example.com"
}
```

2. **Response:**
```json
{
  "message": "Verification code sent to your email"
}
```

3. **Database İşlemleri:**
   - User bulunur
   - 6 haneli code generate edilir
   - Code ve 15 dakikalık expiry zamanı database'e kaydedilir
   - Email gönderilir

### Email Doğrulama

1. **Request:**
```bash
POST /auth/verify-email
{
  "email": "john@example.com",
  "code": "123456"
}
```

2. **Validation İşlemleri:**
   - User bulunur
   - `isEmailVerified` ve `emailVerifiedAt` false/null ise kontrol et
   - Code eşleşme kontrolü
   - Expiry zamanı kontrol et (geçmişse reject et)

3. **Success Response:**
```json
{
  "message": "Email verified successfully"
}
```

4. **Database Güncellemeleri:**
   - `isEmailVerified = true`
   - `emailVerifiedAt = NOW()`
   - `verificationCode = NULL`
   - `verificationCodeExpiresAt = NULL`

## Code Lifetime

- **Geçerlilik Süresi:** 15 dakika
- **Format:** 6 haneli rastgele sayı (100000-999999)
- **Örnek:** 456789

## Error Handling

| Hata | Status | Mesaj |
|------|--------|-------|
| User bulunamadı | 404 | User with email ... not found |
| Verification code yok | 400 | No verification code found for this email |
| Hatalı code | 400 | Invalid verification code |
| Code süresi doldu | 400 | Verification code has expired |
| Email gönderme hatası | 400 | Failed to send verification code |

## Security Considerations

1. **Rate Limiting:** Aynı email için çokça code göndermeyi limit et (ileride eklenecek)
2. **Code Format:** 6 haneli format brute force'u zor kılar
3. **Short Lifetime:** 15 dakikalık süre credential stuffing'i engeller
4. **One-Time Use:** Code doğrulandıktan sonra silinir
5. **HTTPS:** Tüm requests HTTPS üzerinden olmalı (production'da)

## İleride Eklenecekler

- [ ] Rate limiting per email
- [ ] Resend code functionality (cooldown ile)
- [ ] SMS verification option
- [ ] Multi-factor authentication
- [ ] Code complexity rules

## Testing

```bash
# 1. Code gönder
curl -X POST http://localhost:3000/auth/send-verification-code \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# 2. Database'ten code'u kontrol et (development only)
SELECT verification_code FROM users WHERE email = 'test@example.com';

# 3. Code'u doğrula
curl -X POST http://localhost:3000/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "code": "123456"}'

# 4. User verilerini kontrol et
curl -X GET http://localhost:3000/users/4 \
  -H "Authorization: Bearer JWT_TOKEN"
# Response'ta isEmailVerified: true olmalı
```
