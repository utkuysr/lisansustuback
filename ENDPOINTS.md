# API Endpoint Dokümantasyonu

**Başka Dökümantasyon Dosyaları:**
- [Email Verification Sistemi](./EMAIL_VERIFICATION.md) - Email verification code gönderme ve doğrulama

## 1. ROLES ENDPOINTLERİ

### 1.1 Role Oluştur
```http
POST /roles
Content-Type: application/json

{
  "name": "admin",
  "description": "Administrator role with full access",
  "isActive": true
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "name": "admin",
  "description": "Administrator role with full access",
  "isActive": true,
  "createdAt": "2026-03-11T18:30:00.000Z"
}
```

---

### 1.2 Tüm Roles'ı Listele
```http
GET /roles
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "admin",
    "description": "Administrator role with full access",
    "isActive": true,
    "createdAt": "2026-03-11T18:30:00.000Z"
  },
  {
    "id": 2,
    "name": "student",
    "description": "Student role with limited access",
    "isActive": true,
    "createdAt": "2026-03-11T18:31:00.000Z"
  }
]
```

---

### 1.3 Belirli Role Getir
```http
GET /roles/1
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "admin",
  "description": "Administrator role with full access",
  "isActive": true,
  "createdAt": "2026-03-11T18:30:00.000Z"
}
```

---

### 1.4 Role Güncelle
```http
PUT /roles/1
Content-Type: application/json

{
  "name": "super_admin",
  "description": "Super Administrator with elevated privileges",
  "isActive": true
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "super_admin",
  "description": "Super Administrator with elevated privileges",
  "isActive": true,
  "createdAt": "2026-03-11T18:30:00.000Z"
}
```

---

### 1.5 Role Sil
```http
DELETE /roles/1
```

**Response (200 OK):**
```json
{
  "message": "Role deleted successfully"
}
```

---

## 2. USERS ENDPOINTLERİ

### 2.1 Kullanıcı Oluştur
```http
POST /users
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john.doe@example.com",
  "passwordHash": "Secure123!",
  "firstName": "John",
  "lastName": "Doe",
  "userType": "student",
  "createdBy": 1,
  "profileImageUrl": "https://example.com/images/john.jpg",
  "phone": "+905551234567",
  "languageCode": "tr"
}
```

**Response (201 Created):**
```json
{
  "id": 5,
  "username": "john_doe",
  "email": "john.doe@example.com",
  "passwordHash": "$2b$10$hashedPasswordValue...",
  "firstName": "John",
  "lastName": "Doe",
  "userType": "student",
  "isActive": true,
  "createdBy": 1,
  "updatedBy": null,
  "createDate": "2026-03-11T18:40:00.000Z",
  "updateDate": null,
  "profileImageUrl": "https://example.com/images/john.jpg",
  "phone": "+905551234567",
  "isEmailVerified": false,
  "emailVerifiedAt": null,
  "passwordResetExpires": null,
  "languageCode": "tr",
  "role": {
    "id": 2,
    "name": "student",
    "description": "Student role with limited access",
    "isActive": true,
    "createdAt": "2026-03-11T18:31:00.000Z"
  }
}
```

---

### 2.2 Tüm Kullanıcıları Listele
```http
GET /users
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "username": "admin_user",
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "userType": "admin",
    "isActive": true,
    "phone": "+905551111111",
    "isEmailVerified": true,
    "languageCode": "tr",
    "role": {
      "id": 1,
      "name": "admin"
    }
  },
  {
    "id": 5,
    "username": "john_doe",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "userType": "student",
    "isActive": true,
    "phone": "+905551234567",
    "isEmailVerified": false,
    "languageCode": "tr",
    "role": {
      "id": 2,
      "name": "student"
    }
  }
]
```

---

### 2.3 Belirli Kullanıcı Getir
```http
GET /users/5
```

**Response (200 OK):**
```json
{
  "id": 5,
  "username": "john_doe",
  "email": "john.doe@example.com",
  "passwordHash": "$2b$10$hashedPasswordValue...",
  "firstName": "John",
  "lastName": "Doe",
  "userType": "student",
  "isActive": true,
  "createdBy": 1,
  "updatedBy": null,
  "createDate": "2026-03-11T18:40:00.000Z",
  "updateDate": null,
  "profileImageUrl": "https://example.com/images/john.jpg",
  "phone": "+905551234567",
  "isEmailVerified": false,
  "emailVerifiedAt": null,
  "passwordResetExpires": null,
  "languageCode": "tr",
  "role": {
    "id": 2,
    "name": "student",
    "description": "Student role with limited access",
    "isActive": true,
    "createdAt": "2026-03-11T18:31:00.000Z"
  }
}
```

---

### 2.4 Kullanıcı Güncelle (Admin veya Kendisi)
```http
PUT /users/5
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "firstName": "Jonathan",
  "lastName": "Doe",
  "phone": "+905559999999",
  "profileImageUrl": "https://example.com/images/jonathan.jpg",
  "languageCode": "en"
}
```

**Response (200 OK):**
```json
{
  "id": 5,
  "username": "john_doe",
  "email": "john.doe@example.com",
  "firstName": "Jonathan",
  "lastName": "Doe",
  "userType": "student",
  "isActive": true,
  "phone": "+905559999999",
  "profileImageUrl": "https://example.com/images/jonathan.jpg",
  "languageCode": "en",
  "updateDate": "2026-03-11T19:00:00.000Z",
  "role": {
    "id": 2,
    "name": "student"
  }
}
```

**Error Response - Unauthorized (403 Forbidden):**
```json
{
  "message": "You can only update your own profile or be an admin",
  "statusCode": 403
}
```

---

### 2.5 Şifre Sıfırla (Admin veya Kendisi)
```http
POST /users/5/reset-password
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "newPassword": "NewAdminResetPassword123!"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset successfully"
}
```

**Error Response - Unauthorized (403 Forbidden):**
```json
{
  "message": "You can only reset your own password or be an admin",
  "statusCode": 403
}
```

---

### 2.6 Kullanıcı Sil (Admin veya Kendisi)
```http
DELETE /users/5
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "message": "User deleted successfully"
}
```

**Error Response - Unauthorized (403 Forbidden):**
```json
{
  "message": "You can only delete your own account or be an admin",
  "statusCode": 403
}
```

---

## 3. AUTHENTICATION ENDPOINTLERİ

### 3.1 Giriş (Login)
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "Secure123!"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjUsImVtYWlsIjoiam9obi5kb2VAZXhhbXBsZS5jb20iLCJyb2xlIjoic3R1ZGVudCIsImlhdCI6MTY0NjQwMDAwMCwiZXhwIjoxNjQ2NDg2NDAwfQ.signatureHere",
  "user": {
    "id": 5,
    "email": "john.doe@example.com",
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "message": "Invalid credentials",
  "statusCode": 401
}
```

---

### 3.2 Şifre Değiştir
```http
POST /auth/change-password
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "currentPassword": "Secure123!",
  "newPassword": "NewSecure456!",
  "confirmPassword": "NewSecure456!"
}
```

**Response (200 OK):**
```json
{
  "message": "Password changed successfully"
}
```

**Error Response - Yanlış Mevcut Şifre (400 Bad Request):**
```json
{
  "message": "Current password is incorrect",
  "statusCode": 400
}
```

**Error Response - Şifreler Eşleşmez (400 Bad Request):**
```json
{
  "message": "New passwords do not match",
  "statusCode": 400
}
```

**Error Response - Unauthorized (401):**
```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

---

### 3.3 Verification Code Gönder
```http
POST /auth/send-verification-code
Content-Type: application/json

{
  "email": "john.doe@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "Verification code sent to your email"
}
```

**Error Response - User Bulunamadı (404 Not Found):**
```json
{
  "message": "User with email john.doe@example.com not found",
  "statusCode": 404
}
```

**Error Response - Email Gönderme Başarısız (400 Bad Request):**
```json
{
  "message": "Failed to send verification code",
  "statusCode": 400
}
```

---

### 3.4 Email'i Doğrula (Verification Code)
```http
POST /auth/verify-email
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "code": "123456"
}
```

**Response (200 OK):**
```json
{
  "message": "Email verified successfully"
}
```

**Error Response - Verification Code Bulunamadı (400 Bad Request):**
```json
{
  "message": "No verification code found for this email",
  "statusCode": 400
}
```

**Error Response - Hatalı Code (400 Bad Request):**
```json
{
  "message": "Invalid verification code",
  "statusCode": 400
}
```

**Error Response - Code Süresi Doldu (400 Bad Request):**
```json
{
  "message": "Verification code has expired",
  "statusCode": 400
}
```

---

## CURL ÖRNEKLERI

### Tüm Roles'ı Listele
```bash
curl -X GET http://localhost:3000/roles
```

### Role Oluştur
```bash
curl -X POST http://localhost:3000/roles \
  -H "Content-Type: application/json" \
  -d '{
    "name": "teacher",
    "description": "Teacher role",
    "isActive": true
  }'
```

### Kullanıcı Oluştur
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john.doe@example.com",
    "passwordHash": "Secure123!",
    "firstName": "John",
    "lastName": "Doe",
    "userType": "student",
    "phone": "+905551234567",
    "languageCode": "tr"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "Secure123!"
  }'
```

### Şifre Değiştir (JWT Token Gerekli)
```bash
curl -X POST http://localhost:3000/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "currentPassword": "Secure123!",
    "newPassword": "NewSecure456!",
    "confirmPassword": "NewSecure456!"
  }'
```

### Kullanıcı Güncelle (Admin veya Kendisi)
```bash
curl -X PUT http://localhost:3000/users/5 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN_HERE" \
  -d '{
    "firstName": "Jonathan",
    "phone": "+905559999999"
  }'
```

### Şifre Sıfırla (Admin veya Kendisi)
```bash
curl -X POST http://localhost:3000/users/5/reset-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN_HERE" \
  -d '{
    "newPassword": "NewAdminResetPassword123!"
  }'
```

### Kullanıcı Sil (Admin veya Kendisi)
```bash
curl -X DELETE http://localhost:3000/users/5 \
  -H "Authorization: Bearer JWT_TOKEN_HERE"
```

### Verification Code Gönder
```bash
curl -X POST http://localhost:3000/auth/send-verification-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com"
  }'
```

### Email Doğrula (Verification Code)
```bash
curl -X POST http://localhost:3000/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "code": "123456"
  }'
```

---

## 📋 ENDPOINT ÖZETI

| Method | URL | Kimin Yapabilir | Açıklama |
|--------|-----|-----------------|----------|
| POST | /users | ❌ Herkes | Yeni user oluştur |
| GET | /users | ❌ Herkes | Tüm users'ı listele |
| GET | /users/:id | ❌ Herkes | Belirli user getir |
| PUT | /users/:id | ✅ Admin veya Kendisi | User verilerini güncelle |
| POST | /users/:id/reset-password | ✅ Admin veya Kendisi | Şifre sıfırla |
| DELETE | /users/:id | ✅ Admin veya Kendisi | User'ı sil |
| POST | /roles | ✅ Admin | Role oluştur |
| GET | /roles | ❌ Herkes | Tüm roles'ı listele |
| GET | /roles/:id | ❌ Herkes | Belirli role getir |
| PUT | /roles/:id | ✅ Admin | Role güncelle |
| DELETE | /roles/:id | ✅ Admin | Role sil |
| POST | /auth/login | ❌ Herkes | Giriş yap |
| POST | /auth/change-password | ✅ Authenticated | Kendi şifresi değiştir |
| POST | /auth/send-verification-code | ❌ Herkes | Verification code gönder |
| POST | /auth/verify-email | ❌ Herkes | Email'i doğrula |
