# Lisansüstü Başvuru Sistemi — Frontend API Dökümanı

> **Base URL:** `http://localhost:3000`  
> **Auth:** Tüm istekler (auth hariç) `Authorization: Bearer <access_token>` header'ı gerektirir.  
> **İçerik Tipi:** `Content-Type: application/json`

---

## İçindekiler

1. [Kimlik Doğrulama (Auth)](#1-kimlik-doğrulama)
2. [Kullanıcılar (Users)](#2-kullanıcılar)
3. [Roller (Roles)](#3-roller)
4. [Üniversiteler](#4-üniversiteler)
5. [Enstitüler](#5-enstitüler)
6. [Fakülteler](#6-fakülteler)
7. [Bölümler](#7-bölümler)
8. [Programlar](#8-programlar)
9. [Başvurular](#9-başvurular)
10. [Belgeler (Dosya Yükleme)](#10-belgeler)
11. [Kararlar (Komisyon Değerlendirme)](#11-kararlar)
12. [Mülakatlar](#12-mülakatlar)
13. [Bildirimler](#13-bildirimler)
14. [İstatistikler (Admin)](#14-istatistikler)
15. [Veri Modeli & İlişkiler](#15-veri-modeli--ilişkiler)
16. [Rol Yetki Tablosu](#16-rol-yetki-tablosu)
17. [Başvuru Durum Geçişleri](#17-başvuru-durum-geçişleri)
18. [Hata Formatı](#18-hata-formatı)

---

## 1. Kimlik Doğrulama

### `POST /auth/register`
Öğrenci kaydı. Sadece öğrenci rolü ile kayıt olunur.

**Body:**
```json
{
  "email": "ali@example.com",
  "password": "Abc123!@",
  "firstName": "Ali",
  "lastName": "Yılmaz",
  "username": "aliyilmaz"
}
```

> **Şifre Politikası:** En az 8 karakter, 1 büyük harf, 1 küçük harf, 1 rakam, 1 özel karakter, boşluk yok.

**Yanıt `201`:**
```json
{ "message": "Kullanıcı başarıyla kaydedildi.", "userId": 42 }
```

---

### `POST /auth/login`
*Rate limit: 5 istek / dakika*

**Body:**
```json
{ "email": "ali@example.com", "password": "Abc123!@" }
```

**Yanıt `200`:**
```json
{
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",
  "user": {
    "id": 42,
    "email": "ali@example.com",
    "firstName": "Ali",
    "lastName": "Yılmaz",
    "role": "student"
  }
}
```

> `access_token` → 1 saat geçerli. `refresh_token` → 7 gün geçerli.  
> İkisini de güvenli bir yerde saklayın (httpOnly cookie veya memory).

---

### `POST /auth/refresh`
Access token süresi dolduğunda yeni token al.

**Body:**
```json
{ "refreshToken": "eyJhbGci..." }
```

**Yanıt `200`:**
```json
{ "access_token": "eyJhbGci...", "refresh_token": "eyJhbGci..." }
```

---

### `DELETE /auth/logout`
`Authorization` gerektirir. Refresh token sunucu tarafında geçersiz kılınır.

**Yanıt `200`:** `{ "message": "Çıkış yapıldı." }`

---

### `POST /auth/change-password`
`Authorization` gerektirir.

**Body:**
```json
{
  "currentPassword": "EskiSifre1!",
  "newPassword": "YeniSifre2@",
  "confirmPassword": "YeniSifre2@"
}
```

---

### `POST /auth/send-verification-code`
E-posta doğrulama kodu gönder. *Rate limit: 3 istek / dakika*

**Body:** `{ "email": "ali@example.com" }`

---

### `POST /auth/verify-email`
**Body:** `{ "email": "ali@example.com", "code": "123456" }`

---

## 2. Kullanıcılar

### `GET /users/me`
Giriş yapan kullanıcının profili.

**Yanıt:**
```json
{
  "id": 42,
  "email": "ali@example.com",
  "firstName": "Ali",
  "lastName": "Yılmaz",
  "username": "aliyilmaz",
  "phone": "05001234567",
  "profileImageUrl": null,
  "userType": "student",
  "role": { "id": 1, "name": "student" },
  "isActive": true,
  "isEmailVerified": false,
  "faculty": "Mühendislik",
  "department": "Bilgisayar Mühendisliği",
  "languageCode": "tr"
}
```

---

### `GET /users` *(Admin)*
Tüm kullanıcıları listele.

### `GET /users/:id` *(Admin veya kendisi)*

### `PUT /users/:id` *(Admin veya kendisi)*
**Body (öğrenci güncelleyebileceği alanlar):**
```json
{
  "firstName": "Ali",
  "lastName": "Yılmaz",
  "phone": "05001234567",
  "faculty": "Mühendislik",
  "department": "Bilgisayar Mühendisliği",
  "languageCode": "tr"
}
```

**Body (sadece Admin):**
```json
{
  "roleId": 2,
  "isActive": true,
  "isEmailVerified": true
}
```

---

### `POST /users/:id/reset-password` *(Admin veya kendisi)*
**Body:** `{ "newPassword": "YeniSifre2@" }`

---

### `POST /users` *(Sadece Admin)*
Admin başka kullanıcı (örn. komisyon üyesi) oluşturabilir.

**Body:**
```json
{
  "email": "komisyon@example.com",
  "password": "Komisyon1!",
  "firstName": "Ayşe",
  "lastName": "Kaya",
  "roleId": 3
}
```

---

### `DELETE /users/:id` *(Admin veya kendisi)*
Soft delete — kullanıcı veritabanından silinmez, `deleted_at` set edilir.

---

## 3. Roller

### `GET /roles`
Sistemdeki rolleri listeler.

**Yanıt:**
```json
[
  { "id": 1, "name": "student", "description": "Öğrenci" },
  { "id": 2, "name": "admin", "description": "Yönetici" },
  { "id": 3, "name": "Komisyon Üyesi", "description": "Komisyon Üyesi" }
]
```

> Kullanıcı oluşturma formlarında `roleId` için bu listeyi kullanın.

---

## 4. Üniversiteler

Mevcut üniversite listesi. Sadece listeleme — ekleme/silme Admin panelinden manuel DB ile yapılıyor.

### `GET /universities`
```json
[
  { "id": 1, "name": "Orta Doğu Teknik Üniversitesi", "city": "Ankara", "type": "devlet", "shortName": "ODTÜ" },
  { "id": 2, "name": "Boğaziçi Üniversitesi", "city": "İstanbul", "type": "devlet", "shortName": "BÜ" }
]
```

### `GET /universities/:id`

---

## 5. Enstitüler

Türk üniversite sisteminde lisansüstü programlar enstitü altında açılır.

**Hiyerarşi:** `Üniversite → Enstitü → Program`

### `GET /institutes`
```
GET /institutes                    → Tüm enstitüler
GET /institutes?universityId=1     → Belirli üniversitenin enstitüleri
```

**Yanıt:**
```json
[
  {
    "id": 1,
    "name": "Fen Bilimleri Enstitüsü",
    "university": { "id": 1, "name": "ODTÜ", "city": "Ankara" },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### `GET /institutes/:id`

### `POST /institutes` *(Admin)*
```json
{ "name": "Sosyal Bilimler Enstitüsü", "universityId": 1 }
```

### `PUT /institutes/:id` *(Admin)*
```json
{ "name": "Yeni İsim", "universityId": 2 }
```

### `POST /institutes/:id/archive` *(Admin)*
Soft delete. Yanıt: `{ "message": "Enstitü arşivlendi." }`

### `POST /institutes/:id/restore` *(Admin)*

### `DELETE /institutes/:id` *(Admin)*
Kalıcı silme.

---

## 6. Fakülteler

**Hiyerarşi:** `Üniversite → Fakülte → Bölüm`

### `GET /faculties`
```
GET /faculties                  → Tüm fakülteler
GET /faculties?universityId=1   → Belirli üniversitenin fakülteleri
```

**Yanıt:**
```json
[
  {
    "id": 1,
    "name": "Mühendislik Fakültesi",
    "description": "Mühendislik ve fen bilimleri",
    "university": { "id": 1, "name": "ODTÜ", "city": "Ankara" },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### `GET /faculties/:id`

### `POST /faculties` *(Admin)*
```json
{ "name": "Mühendislik Fakültesi", "description": "...", "universityId": 1 }
```

### `PUT /faculties/:id` *(Admin)*
Tüm alanlar opsiyonel.

### `DELETE /faculties/:id` *(Admin)*
Soft delete.

---

## 7. Bölümler

**Hiyerarşi:** `Fakülte → Bölüm`

### `GET /departments`
```
GET /departments                 → Tüm bölümler
GET /departments?facultyId=1     → Fakültedeki bölümler
```

**Yanıt:**
```json
[
  {
    "id": 1,
    "name": "Bilgisayar Mühendisliği",
    "field": "Mühendislik",
    "faculty": {
      "id": 1,
      "name": "Mühendislik Fakültesi",
      "university": { "id": 1, "name": "ODTÜ" }
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### `GET /departments/:id`

### `POST /departments` *(Admin)*
```json
{ "name": "Bilgisayar Mühendisliği", "field": "Mühendislik", "facultyId": 1 }
```

### `PUT /departments/:id` *(Admin)*
Tüm alanlar opsiyonel.

### `DELETE /departments/:id` *(Admin)*
Soft delete.

---

## 8. Programlar

Lisansüstü başvurulabilir programlar.

**Hiyerarşi:** `Enstitü → Program` ve `Fakülte/Bölüm → Program`

### `GET /programs`

**Filtre parametreleri (hepsi opsiyonel):**
```
?facultyId=1        → Fakültedeki programlar
?departmentId=2     → Bölümdeki programlar
?instituteId=1      → Enstitüdeki programlar
?degreeType=yuksek_lisans   → Yüksek lisans programları
?degreeType=doktora          → Doktora programları
?isActive=true               → Sadece aktif programlar
```

**Yanıt:**
```json
[
  {
    "id": 1,
    "name": "Bilgisayar Mühendisliği Yüksek Lisans",
    "Quota": 20,
    "Description": "Program açıklaması...",
    "ApplicationStartdate": "2024-09-01T00:00:00.000Z",
    "ApplicationEnddate": "2024-10-31T00:00:00.000Z",
    "EvaluationDate": "2024-11-30T00:00:00.000Z",
    "degreeType": "yuksek_lisans",
    "isActive": true,
    "faculty": { "id": 1, "name": "Mühendislik Fakültesi", "university": { "id": 1, "name": "ODTÜ" } },
    "department": { "id": 1, "name": "Bilgisayar Mühendisliği" },
    "institute": { "id": 1, "name": "Fen Bilimleri Enstitüsü" },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

> **`degreeType` değerleri:** `"yuksek_lisans"` veya `"doktora"`

---

### `GET /programs/:id`
Tekil program detayı.

---

### `GET /programs/:id/quota`
Kontenjan doluluk durumu.

**Yanıt:**
```json
{ "quota": 20, "accepted": 5, "available": 15 }
```

> Başvuru formunda bu endpoint ile kontenjan kontrolü yapın. `available === 0` ise kullanıcıyı uyarın.

---

### `POST /programs` *(Admin)*
```json
{
  "name": "Makine Mühendisliği Doktora",
  "Quota": 10,
  "Description": "Program açıklaması",
  "ApplicationStartdate": "2024-09-01",
  "ApplicationEnddate": "2024-10-31",
  "EvaluationDate": "2024-11-30",
  "degreeType": "doktora",
  "isActive": true,
  "facultyId": 1,
  "departmentId": 2,
  "instituteId": 1
}
```

---

### `PUT /programs/:id` *(Admin)*
Aynı body, tüm alanlar opsiyonel.

---

### `DELETE /programs/:id` *(Admin)*
Soft delete — mevcut başvurular etkilenmez.

---

### `GET /programs/my-programs` *(Komisyon Üyesi)*
Giriş yapan komisyon üyesinin atandığı programlar.

---

### `GET /programs/:id/commissioners` *(Admin)*
Programa atanmış komisyon üyeleri.

**Yanıt:**
```json
[
  { "id": 5, "email": "komisyon@uni.edu.tr", "firstName": "Ahmet", "lastName": "Demir", "role": "Komisyon Üyesi" }
]
```

---

### `PUT /programs/:id/commissioners` *(Admin)*
Programa komisyon üyesi ata. Önceki atamalar **tamamen silinir**, yenileri yazılır.

```json
{ "commissionerIds": [5, 6, 7] }
```

> **Dikkat:** Bu işlem önceki komisyon üyelerini değiştirir. En az 1 kullanıcı zorunludur.  
> Atanacak kullanıcılar `"Komisyon Üyesi"` rolüne sahip olmalıdır.

---

## 9. Başvurular

### Başvuru Durumları

| Durum | Açıklama |
|---|---|
| `draft` | Taslak — öğrenci oluşturdu, henüz göndermedi |
| `submitted` | Gönderildi — komisyon incelemesini bekliyor |
| `under_review` | İnceleniyor — en az 1 komisyon üyesi değerlendirme yaptı |
| `interview_required` | Mülakat gerekli |
| `accepted` | Kabul edildi |
| `rejected` | Reddedildi |
| `waitlisted` | Bekleme listesi |

---

### `POST /applications`
Yeni başvuru oluştur (her zaman `draft` olarak açılır).

**Body:**
```json
{
  "programId": 1,
  "GradePointAverage": 3.2,
  "gpaScale": "4.0",
  "alesScore": 78.5,
  "ydsScore": 82.0,
  "degreeType": "yuksek_lisans",
  "universityId": 1,
  "departmentId": 2
}
```

| Alan | Zorunlu | Açıklama |
|---|---|---|
| `programId` | ✅ | Başvurulan program |
| `GradePointAverage` | opsiyonel | Not ortalaması (0-4 arası) |
| `gpaScale` | opsiyonel | `"4.0"` (varsayılan) veya `"100"` |
| `alesScore` | opsiyonel | ALES puanı (0-100) |
| `ydsScore` | opsiyonel | YDS/Dil puanı (0-100) |
| `degreeType` | opsiyonel | `"yuksek_lisans"` veya `"doktora"` |
| `universityId` | opsiyonel | Mezun olduğu üniversite |
| `departmentId` | opsiyonel | Mezun olduğu bölüm |

> Admin başkası adına başvuru oluştururken `userId` ekleyebilir.

---

### `GET /applications/me`
Giriş yapan öğrencinin kendi başvuruları.

**Yanıt (array):**
```json
[
  {
    "id": 10,
    "status": "draft",
    "GradePointAverage": 3.2,
    "gpaScale": "4.0",
    "alesScore": 78.5,
    "ydsScore": 82.0,
    "degreeType": "yuksek_lisans",
    "ApplicationDate": "2024-10-15T10:00:00.000Z",
    "createdAt": "2024-10-15T10:00:00.000Z",
    "program": {
      "id": 1,
      "name": "Bilgisayar Mühendisliği YL",
      "degreeType": "yuksek_lisans"
    },
    "university": { "id": 1, "name": "ODTÜ" },
    "department": { "id": 2, "name": "Bilgisayar Mühendisliği" },
    "documents": [],
    "decisions": []
  }
]
```

---

### `GET /applications`

**Role göre davranış:**

| Rol | Ne görür? |
|---|---|
| `admin` | Tüm başvurular |
| `Komisyon Üyesi` | Sadece atandığı programların başvuruları |
| `student` | Sadece kendi başvuruları |

**Filtre parametreleri (Admin için):**
```
?page=1&limit=20&programId=1&status=submitted
```

**Yanıt:**
```json
{
  "data": [ ... ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "pages": 8
}
```

---

### `GET /applications/:id`
Tekil başvuru detayı.

> Komisyon üyesi sadece atandığı programın başvurularını görebilir.  
> Öğrenci sadece kendi başvurularını görebilir.

---

### `PATCH /applications/:id`
Başvuru güncelle.

**Öğrenci — sadece taslak başvurularını güncelleyebilir ve yalnızca `submitted` durumuna geçirebilir:**
```json
{ "status": "submitted" }
```

> `submitted` yapılmadan önce en az 1 diploma ve 1 transkript yüklenmiş olmalıdır.  
> Aksi halde `400` hatası döner.

**Admin — ek olarak şunları yapabilir:**
```json
{
  "status": "accepted",
  "GradePointAverage": 3.5,
  "alesScore": 85,
  "ydsScore": 90
}
```

---

### `DELETE /applications/:id` *(Admin)*
Kalıcı silme.

---

### `POST /applications/:id/archive` *(Admin)*
Soft delete + arşiv.

**Body:**
```json
{ "reason": "Aday programa uygun değil" }
```

---

### `POST /applications/:id/restore` *(Admin)*
Arşivden geri al.

---

### `GET /applications/archived` *(Admin)*
Arşivlenmiş başvurular. Sayfalama destekler.

---

## 10. Belgeler

Başvuruya eklenebilecek belge türleri:

| Tür | Limit | Açıklama |
|---|---|---|
| `diploma` | 1 | Lisans diploması |
| `transcript` | 1 | Transkript |
| `yds` | 2 | Dil belgesi (YDS, TOEFL vb.) |
| `attachments` | 10 | Ek belgeler |

**İzin verilen dosya türleri:** PDF, JPEG, PNG  
**Maksimum boyut:** 5 MB / dosya

---

### `POST /applications/:applicationId/documents`

`multipart/form-data` ile gönderilir. Her alan array olabilir.

**Form alanları:**
```
diploma:     (dosya)
transcript:  (dosya)
yds:         (dosya)
attachments: (dosya)
```

**Yanıt `201`:**
```json
{
  "status": "success",
  "message": "Dosyalar kaydedildi.",
  "documents": [
    { "id": 1, "type": "DIPLOMA", "url": "/documents/diploma-1234.pdf" },
    { "id": 2, "type": "TRANSCRIPT", "url": "/documents/transcript-5678.pdf" }
  ]
}
```

> Dosyaya `/documents/diploma-1234.pdf` URL'i ile erişilebilir (auth gerektirmez).

---

### `GET /applications/:applicationId/documents`
Başvuruya ait tüm belgeleri listele.

**Yanıt:**
```json
[
  {
    "id": 1,
    "type": "DIPLOMA",
    "url": "/documents/diploma-1234.pdf",
    "originalName": "diplomam.pdf",
    "mimeType": "application/pdf",
    "size": 204800,
    "createdAt": "2024-10-15T10:00:00.000Z"
  }
]
```

---

### `DELETE /applications/documents/:documentId`
Belge sil. Disk üzerindeki dosya da silinir.

**Yanıt:** `{ "message": "Belge silindi." }`

> Öğrenci sadece kendi başvurusunun belgelerini silebilir.

---

## 11. Kararlar (Komisyon Değerlendirme)

Komisyon üyeleri her başvuru için bir karar girebilir.

### Karar Durumları

| Durum | Açıklama |
|---|---|
| `pending_review` | Henüz karar verilmedi (varsayılan) |
| `accepted` | Kabul |
| `rejected` | Red |
| `waitlisted` | Bekleme listesi |
| `interview_required` | Mülakat gerekli |

---

### Otomatik Konsensüs Mekanizması

> Bir programa atanan **tüm** komisyon üyeleri karar verdiğinde sistem otomatik olarak başvuru durumunu günceller:

| Çoğunluk kararı | Başvuru durumu |
|---|---|
| Herhangi bir `interview_required` | → `interview_required` |
| `accepted` çoğunlukta, kontenjan var | → `accepted` |
| `accepted` çoğunlukta, kontenjan dolu | → `waitlisted` |
| `rejected` çoğunlukta | → `rejected` |
| `waitlisted` çoğunlukta | → `waitlisted` |
| Beraberlik | → `under_review` kalır, admin karar verir |

---

### `POST /decisions` *(Komisyon Üyesi)*
Değerlendirme yap.

**Koşullar:**
- Başvuru dönemi (`ApplicationEnddate`) geçmiş olmalı
- Değerlendirme dönemi (`EvaluationDate`) geçmemiş olmalı
- Aynı başvuru için daha önce karar verilmemiş olmalı
- Komisyon üyesi o programa atanmış olmalı

**Body:**
```json
{
  "applicationId": 10,
  "status": "accepted",
  "notes": "Adayın akademik geçmişi yeterli.",
  "score": 85.5
}
```

| Alan | Zorunlu | Açıklama |
|---|---|---|
| `applicationId` | ✅ | Değerlendirilen başvuru |
| `status` | ✅ | Karar durumu |
| `notes` | opsiyonel | Değerlendirme notu |
| `score` | opsiyonel | 0-100 arası puan |

---

### `GET /decisions` 
- Admin → tüm kararlar  
- Komisyon üyesi → sadece kendi kararları

---

### `GET /decisions/program/:programId`
Programa ait tüm kararlar.

---

### `GET /decisions/application/:applicationId`
Başvuruya ait tüm kararlar.

---

### `GET /decisions/:id`

---

### `PUT /decisions/:id` *(Komisyon Üyesi — sadece kendi kararı)*
Kararı güncelle. Değerlendirme dönemi bitmemişse geçerli.

```json
{ "status": "rejected", "notes": "Güncelleme notu", "score": 72 }
```

---

### `DELETE /decisions/:id` *(Admin)*

---

## 12. Mülakatlar

`interview_required` durumundaki başvurular için mülakat planlanabilir.

### Mülakat Durumları

| Durum | Açıklama |
|---|---|
| `scheduled` | Planlandı |
| `completed` | Tamamlandı |
| `cancelled` | İptal |
| `no_show` | Aday gelmedi |

---

### `POST /interviews` *(Admin veya Komisyon Üyesi)*

**Koşul:** Başvuru `interview_required` durumunda olmalı.

**Body:**
```json
{
  "applicationId": 10,
  "scheduledAt": "2024-12-15T14:00:00.000Z",
  "location": "Mühendislik Fakültesi B Blok, Oda 201",
  "notes": "Aday teknik sorularla değerlendirilecek.",
  "interviewerId": 5
}
```

> Mülakat oluşturulduğunda başvuru sahibine otomatik bildirim gider.

---

### `GET /interviews` *(Admin)*
Tüm mülakatlar.

---

### `GET /interviews/application/:applicationId`
Başvuruya ait mülakatlar.

---

### `GET /interviews/:id`

---

### `PUT /interviews/:id` *(Admin veya Komisyon Üyesi)*
```json
{
  "status": "completed",
  "score": 78.5,
  "notes": "Mülakat başarıyla tamamlandı.",
  "scheduledAt": "2024-12-15T14:00:00.000Z",
  "location": "Online (Zoom)",
  "interviewerId": 6
}
```

---

### `DELETE /interviews/:id` *(Admin)*

---

## 13. Bildirimler

Sistem olaylarında (başvuru gönderildi, kabul/red vb.) otomatik bildirim oluşturulur.

### Bildirim Türleri

| Tür | Tetikleyici |
|---|---|
| `application_submitted` | Başvuru gönderildi |
| `application_under_review` | İlk komisyon değerlendirmesi yapıldı |
| `application_accepted` | Başvuru kabul edildi |
| `application_rejected` | Başvuru reddedildi |
| `application_waitlisted` | Bekleme listesine alındı |
| `application_interview_required` | Mülakat gerekli |
| `decision_made` | Komisyon üyesi değerlendirme yaptı |
| `interview_scheduled` | Mülakat planlandı |
| `general` | Genel bildirim |

---

### `GET /notifications`
Giriş yapan kullanıcının bildirimleri (en yeniden eskiye).

**Yanıt:**
```json
[
  {
    "id": 1,
    "type": "application_submitted",
    "title": "Başvurunuz gönderildi",
    "message": "\"Bilgisayar Mühendisliği YL\" programına başvurunuz gönderildi.",
    "isRead": false,
    "metadata": { "applicationId": 10, "programId": 1 },
    "createdAt": "2024-10-15T10:00:00.000Z",
    "readAt": null
  }
]
```

---

### `GET /notifications/unread-count`
Okunmamış bildirim sayısı.

**Yanıt:** `{ "count": 3 }`

---

### `PATCH /notifications/:id/read`
Bildirimi okundu işaretle.

---

### `PATCH /notifications/read-all`
Tüm bildirimleri okundu işaretle.

---

### `DELETE /notifications/:id`
Bildirimi sil.

---

## 14. İstatistikler (Admin)

Tüm istatistik endpoint'leri `admin` rolü gerektirir.

---

### `GET /admin/stats`
Genel özet.

**Yanıt:**
```json
{
  "totalUsers": 250,
  "totalApplications": 480,
  "totalPrograms": 12,
  "totalDecisions": 320,
  "usersByRole": [
    { "role": "student", "count": "230" },
    { "role": "Komisyon Üyesi", "count": "15" },
    { "role": "admin", "count": "5" }
  ],
  "applicationsByStatus": [
    { "status": "draft", "count": "80" },
    { "status": "submitted", "count": "120" },
    { "status": "under_review", "count": "150" },
    { "status": "accepted", "count": "80" },
    { "status": "rejected", "count": "40" },
    { "status": "waitlisted", "count": "10" }
  ]
}
```

---

### `GET /admin/stats/applications`
Başvuru istatistikleri.

**Yanıt:**
```json
{
  "byStatus": [ { "status": "accepted", "count": "80" } ],
  "byProgram": [
    { "programId": "1", "programName": "Bilgisayar Müh. YL", "count": "120" }
  ],
  "recentByDay": [
    { "date": "2024-10-01T00:00:00.000Z", "count": "15" }
  ]
}
```

---

### `GET /admin/stats/programs`
Program istatistikleri — kontenjan doluluk, kabul oranı.

**Yanıt:**
```json
[
  {
    "id": "1",
    "name": "Bilgisayar Müh. YL",
    "quota": "20",
    "degreeType": "yuksek_lisans",
    "isActive": true,
    "facultyName": "Mühendislik",
    "departmentName": "Bilgisayar Mühendisliği",
    "instituteName": "Fen Bilimleri Enstitüsü",
    "applicationCount": "120",
    "acceptedCount": "18",
    "rejectedCount": "60",
    "acceptanceRate": "15.0"
  }
]
```

---

### `GET /admin/stats/users`
Kullanıcı istatistikleri — rol dağılımı, son 30 gün kayıt.

---

### `GET /admin/stats/decisions`
Karar istatistikleri — program bazında ortalama skor, komisyon üyesi bazında karar sayısı.

**Yanıt:**
```json
{
  "avgScoreByProgram": [
    { "programId": "1", "programName": "Bilgisayar Müh. YL", "avgScore": "78.5", "decisionCount": "100" }
  ],
  "pendingByCommissioner": [
    { "commissionerId": "5", "commissionerName": "Ahmet Demir", "decidedCount": "45" }
  ],
  "byStatus": [
    { "status": "accepted", "count": "80" }
  ]
}
```

---

## 15. Veri Modeli & İlişkiler

```
Üniversite
  ├── Enstitü (program lisansüstü için)
  │     └── Program ──────┐
  └── Fakülte              │
        └── Bölüm ─────── Program
                               │
                         ProgramKomisyon ── KomisyonÜyesi (User)
                               │
                          Başvuru (Application)
                          │    │    │
                       User  Üniversite  Bölüm
                          │    (mezun)   (mezun)
                          │
                    ┌─────┴──────┐
                 Belgeler     Kararlar
                              │
                          KomisyonÜyesi
```

---

### İlişki Özeti

| Tablo | Bağlı olduğu |
|---|---|
| `Faculty` | `University` |
| `Department` | `Faculty` |
| `Institute` | `University` |
| `Program` | `Faculty`, `Department`, `Institute`, `User (createdBy)` |
| `ProgramCommissioner` | `Program`, `User` |
| `Application` | `User`, `Program`, `University (mezun)`, `Department (mezun)` |
| `Decision` | `Application`, `User (commissioner)` |
| `ApplicationDocument` | `Application` |
| `Interview` | `Application`, `User (interviewer)` |
| `Notification` | `User` |

---

## 16. Rol Yetki Tablosu

| İşlem | student | Komisyon Üyesi | admin |
|---|---|---|---|
| Kayıt / Giriş | ✅ | ✅ | ✅ |
| Kendi profilini görme | ✅ | ✅ | ✅ |
| Kullanıcıları listeleme | ❌ | ❌ | ✅ |
| Kullanıcı oluşturma | ❌ | ❌ | ✅ |
| Programları listeleme | ✅ | ✅ | ✅ |
| Program oluşturma/düzenleme | ❌ | ❌ | ✅ |
| Başvuru oluşturma | ✅ | ❌ | ✅ |
| Kendi başvurularını görme | ✅ | ❌ | ✅ |
| Başvuruyu gönderme (draft→submitted) | ✅ | ❌ | ✅ |
| Tüm başvuruları görme | ❌ | Atandığı programlar | ✅ |
| Başvuru durumu değiştirme | Sadece submitted | ❌ | ✅ |
| Başvuruyu arşivleme | ❌ | ❌ | ✅ |
| Dosya yükleme | Kendi başvurusuna | ❌ | ✅ |
| Dosya silme | Kendi belgelerini | ❌ | ✅ |
| Değerlendirme yapma | ❌ | Atandığı programlar | ❌ |
| Mülakat oluşturma | ❌ | ✅ | ✅ |
| Fakülte/Bölüm/Enstitü yönetimi | ❌ | ❌ | ✅ |
| Komisyon üyesi atama | ❌ | ❌ | ✅ |
| İstatistikler | ❌ | ❌ | ✅ |

---

## 17. Başvuru Durum Geçişleri

```
                    [Öğrenci belgelerini yükler]
                           ↓
    draft ──────────────→ submitted
      ↑                      ↓
      └──────── (geri)   under_review  ← [1. karar gelince otomatik]
                              ↓
                   ┌──────────┼──────────┐
                   ↓          ↓          ↓
           interview_required rejected  waitlisted
                   ↓
           [Mülakat tamamlanır]
                   ↓
          accepted / rejected / waitlisted
```

**Otomatik geçişler (sistem tarafından):**
- `submitted` → `under_review`: İlk komisyon üyesi değerlendirme yaptığında
- `under_review` → `accepted/rejected/waitlisted/interview_required`: Tüm komisyon üyeleri oy verdiğinde çoğunluğa göre

**Manuel geçişler:**
- `draft` → `submitted`: Öğrenci veya admin
- Diğer geçişler: Sadece admin (Swagger veya panel üzerinden)

---

## 18. Hata Formatı

Tüm hatalar aynı formatta döner:

```json
{
  "statusCode": 400,
  "message": "Transkript dosyası zorunludur.",
  "error": "Bad Request"
}
```

**Yaygın HTTP kodları:**

| Kod | Anlam |
|---|---|
| `200` | Başarılı |
| `201` | Oluşturuldu |
| `400` | Geçersiz istek (validasyon hatası, iş kuralı ihlali) |
| `401` | Kimlik doğrulanmadı (token yok veya geçersiz) |
| `403` | Yetki yok |
| `404` | Bulunamadı |
| `429` | Çok fazla istek (rate limit) |
| `500` | Sunucu hatası |

---

## Geliştirici Notları

### Token Yönetimi
```
1. Login → access_token + refresh_token al
2. Her istekte: Authorization: Bearer <access_token>
3. 401 gelirse → /auth/refresh ile yeni token al
4. Refresh token da geçersizse → kullanıcıyı login sayfasına yönlendir
```

### Başvuru Akışı (Öğrenci)
```
1. GET /programs?isActive=true  → mevcut programları göster
2. GET /programs/:id/quota      → kontenjan kontrolü
3. POST /applications            → taslak oluştur (draft)
4. POST /applications/:id/documents → diploma + transkript yükle
5. PATCH /applications/:id       → { "status": "submitted" } ile gönder
6. GET /notifications            → durum güncellemelerini takip et
```

### Komisyon Üyesi Akışı
```
1. GET /programs/my-programs        → atandığı programlar
2. GET /applications?programId=X    → o programın başvuruları
3. GET /applications/:id            → başvuru detayı + belgeler
4. POST /decisions                  → değerlendirme yap
5. Tüm komisyon üyeleri oyladıktan sonra → sistem otomatik karar verir
```

### Admin Akışı
```
1. Sistem kurulumu:
   - POST /universities (opsiyonel, seed ile geliyor)
   - POST /institutes (üniversiteye bağlı)
   - POST /faculties  (üniversiteye bağlı)
   - POST /departments (fakülteye bağlı)
   - POST /users (komisyon üyesi rol ile)
   - POST /programs (enstitü + fakülte + bölüm bağla)
   - PUT /programs/:id/commissioners (komisyon üyesi ata)

2. Başvuru dönemi:
   - GET /applications → tüm başvuruları izle
   - GET /admin/stats → genel durum
   - PATCH /applications/:id → gerekirse manuel durum değişikliği

3. Değerlendirme sonrası:
   - Sistem otomatik konsenüs uygular
   - Mülakat gereken durumlar için POST /interviews
   - GET /admin/stats/decisions → skor analizi
```
