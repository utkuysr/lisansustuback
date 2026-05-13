-- ================================================================
-- Türkiye Üniversiteleri, Enstitüler ve Anabilim Dalları Seed
-- Çalıştırma: PGPASSWORD=1234 psql -U postgres -d lisansustu -f seed-universities.sql
-- ================================================================

SET search_path TO belek_graduate_admission, public;

-- ============================================================
-- 1. ÜNİVERSİTELER
-- ============================================================
INSERT INTO universities(name, city, type, short_name) VALUES
  ('İstanbul Üniversitesi',                 'İstanbul',       'devlet', 'İÜ'),
  ('İstanbul Teknik Üniversitesi',          'İstanbul',       'devlet', 'İTÜ'),
  ('Boğaziçi Üniversitesi',                'İstanbul',       'devlet', 'BÜ'),
  ('Marmara Üniversitesi',                  'İstanbul',       'devlet', 'MÜ'),
  ('Yıldız Teknik Üniversitesi',            'İstanbul',       'devlet', 'YTÜ'),
  ('İstanbul Üniversitesi-Cerrahpaşa',      'İstanbul',       'devlet', 'İÜC'),
  ('Ankara Üniversitesi',                   'Ankara',         'devlet', 'AÜ'),
  ('Orta Doğu Teknik Üniversitesi',         'Ankara',         'devlet', 'ODTÜ'),
  ('Hacettepe Üniversitesi',                'Ankara',         'devlet', 'HÜ'),
  ('Gazi Üniversitesi',                     'Ankara',         'devlet', 'GÜ'),
  ('Ege Üniversitesi',                      'İzmir',          'devlet', 'EÜ'),
  ('Dokuz Eylül Üniversitesi',              'İzmir',          'devlet', 'DEÜ'),
  ('İzmir Yüksek Teknoloji Enstitüsü',      'İzmir',          'devlet', 'İYTE'),
  ('Çukurova Üniversitesi',                 'Adana',          'devlet', 'ÇÜ'),
  ('Akdeniz Üniversitesi',                  'Antalya',        'devlet', 'AKÜ'),
  ('Selçuk Üniversitesi',                   'Konya',          'devlet', 'SÜ'),
  ('Uludağ Üniversitesi',                   'Bursa',          'devlet', 'UÜ'),
  ('Karadeniz Teknik Üniversitesi',         'Trabzon',        'devlet', 'KTÜ'),
  ('Erciyes Üniversitesi',                  'Kayseri',        'devlet', 'ERÜ'),
  ('Atatürk Üniversitesi',                  'Erzurum',        'devlet', 'ATAÜ'),
  ('Kocaeli Üniversitesi',                  'Kocaeli',        'devlet', 'KOÜ'),
  ('Sakarya Üniversitesi',                  'Sakarya',        'devlet', 'SAÜ'),
  ('Gebze Teknik Üniversitesi',             'Kocaeli',        'devlet', 'GTÜ'),
  ('Anadolu Üniversitesi',                  'Eskişehir',      'devlet', 'ANAÜ'),
  ('Eskişehir Osmangazi Üniversitesi',      'Eskişehir',      'devlet', 'ESOGÜ'),
  ('Ondokuz Mayıs Üniversitesi',            'Samsun',         'devlet', 'OMÜ'),
  ('Fırat Üniversitesi',                    'Elazığ',         'devlet', 'FÜ'),
  ('İnönü Üniversitesi',                    'Malatya',        'devlet', 'İNÜ'),
  ('Gaziantep Üniversitesi',                'Gaziantep',      'devlet', 'GAÜN'),
  ('Mersin Üniversitesi',                   'Mersin',         'devlet', 'MEÜ'),
  ('Pamukkale Üniversitesi',                'Denizli',        'devlet', 'PAÜ'),
  ('Süleyman Demirel Üniversitesi',         'Isparta',        'devlet', 'SDÜ'),
  ('Balıkesir Üniversitesi',               'Balıkesir',      'devlet', 'BAÜ'),
  ('Muğla Sıtkı Koçman Üniversitesi',      'Muğla',          'devlet', 'MSKÜ'),
  ('Dicle Üniversitesi',                    'Diyarbakır',     'devlet', 'DÜ'),
  ('Cumhuriyet Üniversitesi',               'Sivas',          'devlet', 'CÜ'),
  ('Trakya Üniversitesi',                   'Edirne',         'devlet', 'TÜ'),
  ('Manisa Celal Bayar Üniversitesi',       'Manisa',         'devlet', 'CBÜ'),
  ('Afyon Kocatepe Üniversitesi',           'Afyonkarahisar', 'devlet', 'AKÜ2'),
  ('Kahramanmaraş Sütçü İmam Üniversitesi','Kahramanmaraş',  'devlet', 'KSÜ')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. ENSTİTÜLER (her üniversiteye 4 enstitü)
-- ============================================================
INSERT INTO institutes(name, university_id, created_at)
SELECT ens.name, u.id, NOW()
FROM universities u
CROSS JOIN (VALUES
  ('Fen Bilimleri Enstitüsü'),
  ('Sosyal Bilimler Enstitüsü'),
  ('Sağlık Bilimleri Enstitüsü'),
  ('Eğitim Bilimleri Enstitüsü')
) AS ens(name)
WHERE NOT EXISTS (
  SELECT 1 FROM institutes i
  WHERE i.name = ens.name AND i.university_id = u.id
);

-- ============================================================
-- 3. ANABİLİM DALLARI
-- ============================================================

-- Fen Bilimleri Enstitüsü anabilim dalları
INSERT INTO departments(name, field, institute_id, created_at)
SELECT d.name, d.field, i.id, NOW()
FROM institutes i
CROSS JOIN (VALUES
  ('Bilgisayar Mühendisliği',              'Mühendislik'),
  ('Elektrik-Elektronik Mühendisliği',     'Mühendislik'),
  ('Makine Mühendisliği',                  'Mühendislik'),
  ('İnşaat Mühendisliği',                  'Mühendislik'),
  ('Kimya Mühendisliği',                   'Mühendislik'),
  ('Endüstri Mühendisliği',               'Mühendislik'),
  ('Çevre Mühendisliği',                   'Mühendislik'),
  ('Gıda Mühendisliği',                    'Mühendislik'),
  ('Biyomühendislik',                      'Mühendislik'),
  ('Malzeme Bilimi ve Mühendisliği',       'Mühendislik'),
  ('Yazılım Mühendisliği',                 'Mühendislik'),
  ('Yapay Zeka ve Veri Mühendisliği',      'Mühendislik'),
  ('Uzay Mühendisliği',                    'Mühendislik'),
  ('Matematik',                            'Temel Bilimler'),
  ('Fizik',                                'Temel Bilimler'),
  ('Kimya',                                'Temel Bilimler'),
  ('Biyoloji',                             'Temel Bilimler'),
  ('İstatistik',                           'Temel Bilimler'),
  ('Nanoteknoloji ve Malzeme Bilimleri',   'Temel Bilimler')
) AS d(name, field)
WHERE i.name = 'Fen Bilimleri Enstitüsü'
  AND NOT EXISTS (
    SELECT 1 FROM departments dep
    WHERE dep.name = d.name AND dep.institute_id = i.id
  );

-- Sosyal Bilimler Enstitüsü anabilim dalları
INSERT INTO departments(name, field, institute_id, created_at)
SELECT d.name, d.field, i.id, NOW()
FROM institutes i
CROSS JOIN (VALUES
  ('İktisat',                                    'Sosyal Bilimler'),
  ('İşletme',                                    'Sosyal Bilimler'),
  ('Kamu Yönetimi',                              'Sosyal Bilimler'),
  ('Siyaset Bilimi ve Uluslararası İlişkiler',   'Sosyal Bilimler'),
  ('Hukuk',                                      'Sosyal Bilimler'),
  ('Psikoloji',                                  'Sosyal Bilimler'),
  ('Sosyoloji',                                  'Sosyal Bilimler'),
  ('Tarih',                                      'Sosyal Bilimler'),
  ('Türk Dili ve Edebiyatı',                     'Sosyal Bilimler'),
  ('Felsefe',                                    'Sosyal Bilimler'),
  ('Coğrafya',                                   'Sosyal Bilimler'),
  ('Medya ve İletişim Çalışmaları',              'Sosyal Bilimler'),
  ('Arkeoloji',                                  'Sosyal Bilimler'),
  ('Finans ve Bankacılık',                       'Sosyal Bilimler'),
  ('Muhasebe ve Denetim',                        'Sosyal Bilimler'),
  ('Ekonometri',                                 'Sosyal Bilimler'),
  ('Turizm İşletmeciliği',                       'Sosyal Bilimler'),
  ('Çalışma Ekonomisi ve Endüstri İlişkileri',   'Sosyal Bilimler'),
  ('Antropoloji',                                'Sosyal Bilimler'),
  ('Sanat Tarihi',                               'Sosyal Bilimler')
) AS d(name, field)
WHERE i.name = 'Sosyal Bilimler Enstitüsü'
  AND NOT EXISTS (
    SELECT 1 FROM departments dep
    WHERE dep.name = d.name AND dep.institute_id = i.id
  );

-- Sağlık Bilimleri Enstitüsü anabilim dalları
INSERT INTO departments(name, field, institute_id, created_at)
SELECT d.name, d.field, i.id, NOW()
FROM institutes i
CROSS JOIN (VALUES
  ('Hemşirelik',                          'Sağlık Bilimleri'),
  ('Eczacılık',                           'Sağlık Bilimleri'),
  ('Fizyoterapi ve Rehabilitasyon',       'Sağlık Bilimleri'),
  ('Biyokimya',                           'Sağlık Bilimleri'),
  ('Tıbbi Mikrobiyoloji',                 'Sağlık Bilimleri'),
  ('Tıbbi Patoloji',                      'Sağlık Bilimleri'),
  ('Halk Sağlığı',                        'Sağlık Bilimleri'),
  ('Anatomi',                             'Sağlık Bilimleri'),
  ('Biyofizik',                           'Sağlık Bilimleri'),
  ('Beslenme ve Diyetetik',               'Sağlık Bilimleri'),
  ('Tıbbi Görüntüleme Teknikleri',        'Sağlık Bilimleri'),
  ('Histoloji ve Embriyoloji',            'Sağlık Bilimleri'),
  ('İmmünoloji',                          'Sağlık Bilimleri'),
  ('Spor Bilimleri',                      'Sağlık Bilimleri')
) AS d(name, field)
WHERE i.name = 'Sağlık Bilimleri Enstitüsü'
  AND NOT EXISTS (
    SELECT 1 FROM departments dep
    WHERE dep.name = d.name AND dep.institute_id = i.id
  );

-- Eğitim Bilimleri Enstitüsü anabilim dalları
INSERT INTO departments(name, field, institute_id, created_at)
SELECT d.name, d.field, i.id, NOW()
FROM institutes i
CROSS JOIN (VALUES
  ('Eğitim Yönetimi ve Denetimi',                'Eğitim Bilimleri'),
  ('Sınıf Öğretmenliği',                         'Eğitim Bilimleri'),
  ('Matematik Eğitimi',                          'Eğitim Bilimleri'),
  ('Fen Bilgisi Eğitimi',                        'Eğitim Bilimleri'),
  ('Türkçe Eğitimi',                             'Eğitim Bilimleri'),
  ('İngilizce Öğretmenliği',                     'Eğitim Bilimleri'),
  ('Psikolojik Danışmanlık ve Rehberlik',        'Eğitim Bilimleri'),
  ('Okul Öncesi Eğitimi',                        'Eğitim Bilimleri'),
  ('Özel Eğitim',                               'Eğitim Bilimleri'),
  ('Eğitim Teknolojisi',                         'Eğitim Bilimleri'),
  ('Sosyal Bilgiler Eğitimi',                    'Eğitim Bilimleri'),
  ('Beden Eğitimi ve Spor Öğretmenliği',         'Eğitim Bilimleri'),
  ('Güzel Sanatlar Eğitimi',                     'Eğitim Bilimleri'),
  ('Bilgisayar ve Öğretim Teknolojileri Eğitimi','Eğitim Bilimleri')
) AS d(name, field)
WHERE i.name = 'Eğitim Bilimleri Enstitüsü'
  AND NOT EXISTS (
    SELECT 1 FROM departments dep
    WHERE dep.name = d.name AND dep.institute_id = i.id
  );

-- ============================================================
-- ÖZET
-- ============================================================
SELECT
  u.name        AS "Üniversite",
  u.city        AS "Şehir",
  COUNT(DISTINCT i.id) AS "Enstitü",
  COUNT(DISTINCT dep.id) AS "Anabilim Dalı"
FROM universities u
LEFT JOIN institutes i   ON i.university_id = u.id
LEFT JOIN departments dep ON dep.institute_id = i.id
GROUP BY u.id, u.name, u.city
ORDER BY u.city, u.name;
