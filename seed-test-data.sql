-- ===========================================================
-- TEST VERİSİ SEED SCRIPTI
-- Tüm test kullanıcılarının şifresi admin ile aynıdır.
-- (admin@belekuni.edu.tr şifresini kullanın)
-- ===========================================================

DO $$
DECLARE
  admin_hash TEXT;
  admin_id   INT;

  -- Kullanıcı ID'leri
  u_student1 INT; u_student2 INT; u_student3 INT; u_student4 INT;
  u_comm1 INT; u_comm2 INT; u_comm3 INT;
  u_mgr1 INT; u_mgr2 INT;

  -- Enstitü ID'leri
  inst1_id INT; inst2_id INT;

  -- Bölüm ID'leri
  dept1_id INT; dept2_id INT; dept3_id INT; dept4_id INT;

  -- Program ID'leri
  prog1_id INT; prog2_id INT; prog3_id INT; prog4_id INT;

BEGIN

  -- Admin hash ve ID'sini al
  SELECT id, password_hash INTO admin_id, admin_hash FROM public.users WHERE email = 'admin@belekuni.edu.tr' LIMIT 1;
  IF admin_hash IS NULL THEN
    RAISE EXCEPTION 'Admin kullanıcısı bulunamadı!';
  END IF;

  -- ============================================================
  -- 1. KULLANICILAR
  -- ============================================================

  -- Öğrenciler
  INSERT INTO public.users (username, email, password_hash, first_name, last_name, user_type, is_active, is_email_verified, email_verified_at, role)
    VALUES ('ogrenci1', 'ogrenci1@test.com', admin_hash, 'Ahmet', 'Yılmaz', 'student', true, true, NOW(), 'student')
    ON CONFLICT (email) DO NOTHING RETURNING id INTO u_student1;
  IF u_student1 IS NULL THEN SELECT id INTO u_student1 FROM public.users WHERE email = 'ogrenci1@test.com'; END IF;

  INSERT INTO public.users (username, email, password_hash, first_name, last_name, user_type, is_active, is_email_verified, email_verified_at, role)
    VALUES ('ogrenci2', 'ogrenci2@test.com', admin_hash, 'Zeynep', 'Kaya', 'student', true, true, NOW(), 'student')
    ON CONFLICT (email) DO NOTHING RETURNING id INTO u_student2;
  IF u_student2 IS NULL THEN SELECT id INTO u_student2 FROM public.users WHERE email = 'ogrenci2@test.com'; END IF;

  INSERT INTO public.users (username, email, password_hash, first_name, last_name, user_type, is_active, is_email_verified, email_verified_at, role)
    VALUES ('ogrenci3', 'ogrenci3@test.com', admin_hash, 'Mehmet', 'Demir', 'student', true, true, NOW(), 'student')
    ON CONFLICT (email) DO NOTHING RETURNING id INTO u_student3;
  IF u_student3 IS NULL THEN SELECT id INTO u_student3 FROM public.users WHERE email = 'ogrenci3@test.com'; END IF;

  INSERT INTO public.users (username, email, password_hash, first_name, last_name, user_type, is_active, is_email_verified, email_verified_at, role)
    VALUES ('ogrenci4', 'ogrenci4@test.com', admin_hash, 'Ayşe', 'Şahin', 'student', true, true, NOW(), 'student')
    ON CONFLICT (email) DO NOTHING RETURNING id INTO u_student4;
  IF u_student4 IS NULL THEN SELECT id INTO u_student4 FROM public.users WHERE email = 'ogrenci4@test.com'; END IF;

  -- Komisyon Üyeleri
  INSERT INTO public.users (username, email, password_hash, first_name, last_name, user_type, is_active, is_email_verified, email_verified_at, role)
    VALUES ('komisyon1', 'komisyon1@test.com', admin_hash, 'Ali', 'Arslan', 'Komisyon Üyesi', true, true, NOW(), 'Komisyon Üyesi')
    ON CONFLICT (email) DO NOTHING RETURNING id INTO u_comm1;
  IF u_comm1 IS NULL THEN SELECT id INTO u_comm1 FROM public.users WHERE email = 'komisyon1@test.com'; END IF;

  INSERT INTO public.users (username, email, password_hash, first_name, last_name, user_type, is_active, is_email_verified, email_verified_at, role)
    VALUES ('komisyon2', 'komisyon2@test.com', admin_hash, 'Fatma', 'Çelik', 'Komisyon Üyesi', true, true, NOW(), 'Komisyon Üyesi')
    ON CONFLICT (email) DO NOTHING RETURNING id INTO u_comm2;
  IF u_comm2 IS NULL THEN SELECT id INTO u_comm2 FROM public.users WHERE email = 'komisyon2@test.com'; END IF;

  INSERT INTO public.users (username, email, password_hash, first_name, last_name, user_type, is_active, is_email_verified, email_verified_at, role)
    VALUES ('komisyon3', 'komisyon3@test.com', admin_hash, 'Hasan', 'Öztürk', 'Komisyon Üyesi', true, true, NOW(), 'Komisyon Üyesi')
    ON CONFLICT (email) DO NOTHING RETURNING id INTO u_comm3;
  IF u_comm3 IS NULL THEN SELECT id INTO u_comm3 FROM public.users WHERE email = 'komisyon3@test.com'; END IF;

  -- Enstitü Yöneticileri
  INSERT INTO public.users (username, email, password_hash, first_name, last_name, user_type, is_active, is_email_verified, email_verified_at, role)
    VALUES ('enstmgr1', 'enstmgr1@test.com', admin_hash, 'Selin', 'Yıldız', 'institute_manager', true, true, NOW(), 'institute_manager')
    ON CONFLICT (email) DO NOTHING RETURNING id INTO u_mgr1;
  IF u_mgr1 IS NULL THEN SELECT id INTO u_mgr1 FROM public.users WHERE email = 'enstmgr1@test.com'; END IF;

  INSERT INTO public.users (username, email, password_hash, first_name, last_name, user_type, is_active, is_email_verified, email_verified_at, role)
    VALUES ('enstmgr2', 'enstmgr2@test.com', admin_hash, 'Murat', 'Koç', 'institute_manager', true, true, NOW(), 'institute_manager')
    ON CONFLICT (email) DO NOTHING RETURNING id INTO u_mgr2;
  IF u_mgr2 IS NULL THEN SELECT id INTO u_mgr2 FROM public.users WHERE email = 'enstmgr2@test.com'; END IF;

  -- ============================================================
  -- 2. ENSTİTÜLER
  -- ============================================================

  INSERT INTO belek_graduate_admission.institutes (name, created_at)
    SELECT 'Fen Bilimleri Enstitüsü', NOW()
    WHERE NOT EXISTS (SELECT 1 FROM belek_graduate_admission.institutes WHERE name = 'Fen Bilimleri Enstitüsü' AND deleted_at IS NULL)
    RETURNING id INTO inst1_id;
  IF inst1_id IS NULL THEN SELECT id INTO inst1_id FROM belek_graduate_admission.institutes WHERE name = 'Fen Bilimleri Enstitüsü' AND deleted_at IS NULL LIMIT 1; END IF;

  INSERT INTO belek_graduate_admission.institutes (name, created_at)
    SELECT 'Sosyal Bilimler Enstitüsü', NOW()
    WHERE NOT EXISTS (SELECT 1 FROM belek_graduate_admission.institutes WHERE name = 'Sosyal Bilimler Enstitüsü' AND deleted_at IS NULL)
    RETURNING id INTO inst2_id;
  IF inst2_id IS NULL THEN SELECT id INTO inst2_id FROM belek_graduate_admission.institutes WHERE name = 'Sosyal Bilimler Enstitüsü' AND deleted_at IS NULL LIMIT 1; END IF;

  -- ============================================================
  -- 3. ENSTİTÜ YÖNETİCİSİ ATAMALARI
  -- ============================================================

  INSERT INTO belek_graduate_admission.institute_managers (user_id, institute_id, created_at)
    SELECT u_mgr1, inst1_id, NOW()
    WHERE NOT EXISTS (SELECT 1 FROM belek_graduate_admission.institute_managers WHERE institute_id = inst1_id);

  INSERT INTO belek_graduate_admission.institute_managers (user_id, institute_id, created_at)
    SELECT u_mgr2, inst2_id, NOW()
    WHERE NOT EXISTS (SELECT 1 FROM belek_graduate_admission.institute_managers WHERE institute_id = inst2_id);

  -- ============================================================
  -- 4. ANABİLİM DALLARI (BÖLÜMLER)
  -- ============================================================

  INSERT INTO belek_graduate_admission.departments (name, institute_id, created_at)
    SELECT 'Bilgisayar Mühendisliği', inst1_id, NOW()
    WHERE NOT EXISTS (SELECT 1 FROM belek_graduate_admission.departments WHERE name = 'Bilgisayar Mühendisliği' AND institute_id = inst1_id AND deleted_at IS NULL)
    RETURNING id INTO dept1_id;
  IF dept1_id IS NULL THEN SELECT id INTO dept1_id FROM belek_graduate_admission.departments WHERE name = 'Bilgisayar Mühendisliği' AND institute_id = inst1_id AND deleted_at IS NULL LIMIT 1; END IF;

  INSERT INTO belek_graduate_admission.departments (name, institute_id, created_at)
    SELECT 'Elektrik-Elektronik Mühendisliği', inst1_id, NOW()
    WHERE NOT EXISTS (SELECT 1 FROM belek_graduate_admission.departments WHERE name = 'Elektrik-Elektronik Mühendisliği' AND institute_id = inst1_id AND deleted_at IS NULL)
    RETURNING id INTO dept2_id;
  IF dept2_id IS NULL THEN SELECT id INTO dept2_id FROM belek_graduate_admission.departments WHERE name = 'Elektrik-Elektronik Mühendisliği' AND institute_id = inst1_id AND deleted_at IS NULL LIMIT 1; END IF;

  INSERT INTO belek_graduate_admission.departments (name, institute_id, created_at)
    SELECT 'İşletme', inst2_id, NOW()
    WHERE NOT EXISTS (SELECT 1 FROM belek_graduate_admission.departments WHERE name = 'İşletme' AND institute_id = inst2_id AND deleted_at IS NULL)
    RETURNING id INTO dept3_id;
  IF dept3_id IS NULL THEN SELECT id INTO dept3_id FROM belek_graduate_admission.departments WHERE name = 'İşletme' AND institute_id = inst2_id AND deleted_at IS NULL LIMIT 1; END IF;

  INSERT INTO belek_graduate_admission.departments (name, institute_id, created_at)
    SELECT 'Psikoloji', inst2_id, NOW()
    WHERE NOT EXISTS (SELECT 1 FROM belek_graduate_admission.departments WHERE name = 'Psikoloji' AND institute_id = inst2_id AND deleted_at IS NULL)
    RETURNING id INTO dept4_id;
  IF dept4_id IS NULL THEN SELECT id INTO dept4_id FROM belek_graduate_admission.departments WHERE name = 'Psikoloji' AND institute_id = inst2_id AND deleted_at IS NULL LIMIT 1; END IF;

  -- ============================================================
  -- 5. PROGRAMLAR
  -- Not: programs tablosundaki "Quota","Description","ApplicationStartdate",
  --      "ApplicationEnddate","EvaluationDate" kolonları büyük harfle başlıyor
  --      (TypeORM entity property name kullanıyor, quote gerekli)
  -- ============================================================

  INSERT INTO belek_graduate_admission.programs (
    name, "Quota", "Description",
    "ApplicationStartdate", "ApplicationEnddate", "EvaluationDate",
    degree_type, is_active, institute_id, department_id,
    min_ales_score, min_gpa, language_exam_required,
    ales_weight, gpa_weight, has_interview, interview_weight,
    "createdBy", created_at
  )
  SELECT
    'Yapay Zeka ve Makine Öğrenmesi', 15,
    'Makine öğrenmesi, derin öğrenme ve yapay zeka alanlarında tezli yüksek lisans programı.',
    '2026-04-01', '2026-06-30', '2026-07-15',
    'tezli_yuksek_lisans', true, inst1_id, dept1_id,
    55, 2.5, false,
    50, 30, true, 20,
    admin_id, NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM belek_graduate_admission.programs WHERE name = 'Yapay Zeka ve Makine Öğrenmesi' AND deleted_at IS NULL
  )
  RETURNING id INTO prog1_id;
  IF prog1_id IS NULL THEN SELECT id INTO prog1_id FROM belek_graduate_admission.programs WHERE name = 'Yapay Zeka ve Makine Öğrenmesi' AND deleted_at IS NULL LIMIT 1; END IF;

  INSERT INTO belek_graduate_admission.programs (
    name, "Quota", "Description",
    "ApplicationStartdate", "ApplicationEnddate", "EvaluationDate",
    degree_type, is_active, institute_id, department_id,
    min_ales_score, min_gpa, language_exam_required, min_language_score,
    ales_weight, gpa_weight, has_interview, interview_weight,
    "createdBy", created_at
  )
  SELECT
    'Siber Güvenlik', 10,
    'Ağ güvenliği, kriptografi ve siber savunma alanlarında doktora programı.',
    '2026-03-01', '2026-05-31', '2026-06-20',
    'doktora', true, inst1_id, dept1_id,
    70, 3.0, true, 65,
    60, 25, true, 15,
    admin_id, NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM belek_graduate_admission.programs WHERE name = 'Siber Güvenlik' AND deleted_at IS NULL
  )
  RETURNING id INTO prog2_id;
  IF prog2_id IS NULL THEN SELECT id INTO prog2_id FROM belek_graduate_admission.programs WHERE name = 'Siber Güvenlik' AND deleted_at IS NULL LIMIT 1; END IF;

  INSERT INTO belek_graduate_admission.programs (
    name, "Quota", "Description",
    "ApplicationStartdate", "ApplicationEnddate", "EvaluationDate",
    degree_type, is_active, institute_id, department_id,
    min_ales_score, min_gpa, language_exam_required,
    ales_weight, gpa_weight,
    "createdBy", created_at
  )
  SELECT
    'İşletme Yönetimi', 20,
    'Stratejik yönetim, pazarlama ve finans alanlarında tezsiz yüksek lisans programı.',
    '2026-04-15', '2026-07-15', '2026-08-01',
    'tezsiz_yuksek_lisans', true, inst2_id, dept3_id,
    50, 2.0, false,
    60, 40,
    admin_id, NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM belek_graduate_admission.programs WHERE name = 'İşletme Yönetimi' AND deleted_at IS NULL
  )
  RETURNING id INTO prog3_id;
  IF prog3_id IS NULL THEN SELECT id INTO prog3_id FROM belek_graduate_admission.programs WHERE name = 'İşletme Yönetimi' AND deleted_at IS NULL LIMIT 1; END IF;

  INSERT INTO belek_graduate_admission.programs (
    name, "Quota", "Description",
    "ApplicationStartdate", "ApplicationEnddate", "EvaluationDate",
    degree_type, is_active, institute_id, department_id,
    min_ales_score, min_gpa, language_exam_required,
    ales_weight, gpa_weight, has_interview, interview_weight,
    "createdBy", created_at
  )
  SELECT
    'Klinik Psikoloji', 8,
    'Psikolojik değerlendirme, terapi ve klinik uygulamalar alanında tezli yüksek lisans.',
    '2026-05-01', '2026-07-31', '2026-08-20',
    'tezli_yuksek_lisans', true, inst2_id, dept4_id,
    55, 2.75, false,
    50, 30, true, 20,
    admin_id, NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM belek_graduate_admission.programs WHERE name = 'Klinik Psikoloji' AND deleted_at IS NULL
  )
  RETURNING id INTO prog4_id;
  IF prog4_id IS NULL THEN SELECT id INTO prog4_id FROM belek_graduate_admission.programs WHERE name = 'Klinik Psikoloji' AND deleted_at IS NULL LIMIT 1; END IF;

  -- ============================================================
  -- 6. KOMİSYON ÜYESİ ATAMALARI
  -- ============================================================

  -- Prog1 (Yapay Zeka) → komisyon1, komisyon2
  INSERT INTO belek_graduate_admission.program_commissioners (program_id, commissioner_id)
    SELECT prog1_id, u_comm1
    WHERE NOT EXISTS (SELECT 1 FROM belek_graduate_admission.program_commissioners WHERE program_id = prog1_id AND commissioner_id = u_comm1);
  INSERT INTO belek_graduate_admission.program_commissioners (program_id, commissioner_id)
    SELECT prog1_id, u_comm2
    WHERE NOT EXISTS (SELECT 1 FROM belek_graduate_admission.program_commissioners WHERE program_id = prog1_id AND commissioner_id = u_comm2);

  -- Prog2 (Siber Güvenlik) → komisyon2, komisyon3
  INSERT INTO belek_graduate_admission.program_commissioners (program_id, commissioner_id)
    SELECT prog2_id, u_comm2
    WHERE NOT EXISTS (SELECT 1 FROM belek_graduate_admission.program_commissioners WHERE program_id = prog2_id AND commissioner_id = u_comm2);
  INSERT INTO belek_graduate_admission.program_commissioners (program_id, commissioner_id)
    SELECT prog2_id, u_comm3
    WHERE NOT EXISTS (SELECT 1 FROM belek_graduate_admission.program_commissioners WHERE program_id = prog2_id AND commissioner_id = u_comm3);

  -- Prog3 (İşletme) → komisyon3
  INSERT INTO belek_graduate_admission.program_commissioners (program_id, commissioner_id)
    SELECT prog3_id, u_comm3
    WHERE NOT EXISTS (SELECT 1 FROM belek_graduate_admission.program_commissioners WHERE program_id = prog3_id AND commissioner_id = u_comm3);

  -- Prog4 (Klinik Psikoloji) → komisyon1
  INSERT INTO belek_graduate_admission.program_commissioners (program_id, commissioner_id)
    SELECT prog4_id, u_comm1
    WHERE NOT EXISTS (SELECT 1 FROM belek_graduate_admission.program_commissioners WHERE program_id = prog4_id AND commissioner_id = u_comm1);

  -- ============================================================
  -- 7. BAŞVURULAR
  -- ============================================================

  -- ogrenci1 → Yapay Zeka (submitted)
  INSERT INTO belek_graduate_admission.applications (
    status, "GradePointAverage", gpa_scale, ales_score, degree_type,
    graduate_university, graduate_faculty, graduate_department,
    "userId", "programId", updated_at
  )
  SELECT 'submitted', 3.45, '4.0', 72.5, 'lisans',
    'Orta Doğu Teknik Üniversitesi', 'Mühendislik Fakültesi', 'Bilgisayar Mühendisliği',
    u_student1, prog1_id, NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM belek_graduate_admission.applications
    WHERE "userId" = u_student1 AND "programId" = prog1_id AND archived_at IS NULL
  );

  -- ogrenci2 → Yapay Zeka (under_review)
  INSERT INTO belek_graduate_admission.applications (
    status, "GradePointAverage", gpa_scale, ales_score, degree_type,
    graduate_university, graduate_faculty, graduate_department,
    "userId", "programId", updated_at
  )
  SELECT 'under_review', 3.8, '4.0', 85.0, 'lisans',
    'Boğaziçi Üniversitesi', 'Mühendislik Fakültesi', 'Bilgisayar Mühendisliği',
    u_student2, prog1_id, NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM belek_graduate_admission.applications
    WHERE "userId" = u_student2 AND "programId" = prog1_id AND archived_at IS NULL
  );

  -- ogrenci3 → Yapay Zeka (accepted)
  INSERT INTO belek_graduate_admission.applications (
    status, "GradePointAverage", gpa_scale, ales_score, degree_type,
    graduate_university, graduate_faculty, graduate_department,
    "userId", "programId", updated_at
  )
  SELECT 'accepted', 3.92, '4.0', 90.0, 'lisans',
    'İstanbul Teknik Üniversitesi', 'Bilgisayar ve Bilişim Fakültesi', 'Bilgisayar Mühendisliği',
    u_student3, prog1_id, NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM belek_graduate_admission.applications
    WHERE "userId" = u_student3 AND "programId" = prog1_id AND archived_at IS NULL
  );

  -- ogrenci4 → İşletme Yönetimi (submitted)
  INSERT INTO belek_graduate_admission.applications (
    status, "GradePointAverage", gpa_scale, ales_score, degree_type,
    graduate_university, graduate_faculty, graduate_department,
    "userId", "programId", updated_at
  )
  SELECT 'submitted', 3.1, '4.0', 62.0, 'lisans',
    'Ankara Üniversitesi', 'Siyasal Bilgiler Fakültesi', 'İşletme',
    u_student4, prog3_id, NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM belek_graduate_admission.applications
    WHERE "userId" = u_student4 AND "programId" = prog3_id AND archived_at IS NULL
  );

  -- ogrenci1 → Klinik Psikoloji (draft)
  INSERT INTO belek_graduate_admission.applications (
    status, "GradePointAverage", gpa_scale, ales_score, degree_type,
    graduate_university, graduate_faculty, graduate_department,
    "userId", "programId", updated_at
  )
  SELECT 'draft', 3.45, '4.0', 72.5, 'lisans',
    'Orta Doğu Teknik Üniversitesi', 'Mühendislik Fakültesi', 'Bilgisayar Mühendisliği',
    u_student1, prog4_id, NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM belek_graduate_admission.applications
    WHERE "userId" = u_student1 AND "programId" = prog4_id AND archived_at IS NULL
  );

  RAISE NOTICE '';
  RAISE NOTICE '=== TEST VERİSİ BAŞARIYLA OLUŞTURULDU ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Tüm test kullanıcılarının şifresi → admin@belekuni.edu.tr ile aynı';
  RAISE NOTICE '';
  RAISE NOTICE 'ÖĞRENCILER:';
  RAISE NOTICE '  ogrenci1@test.com  — Ahmet Yılmaz';
  RAISE NOTICE '  ogrenci2@test.com  — Zeynep Kaya';
  RAISE NOTICE '  ogrenci3@test.com  — Mehmet Demir';
  RAISE NOTICE '  ogrenci4@test.com  — Ayşe Şahin';
  RAISE NOTICE '';
  RAISE NOTICE 'KOMİSYON ÜYELERİ:';
  RAISE NOTICE '  komisyon1@test.com — Ali Arslan    (Yapay Zeka + Klinik Psikoloji)';
  RAISE NOTICE '  komisyon2@test.com — Fatma Çelik   (Yapay Zeka + Siber Güvenlik)';
  RAISE NOTICE '  komisyon3@test.com — Hasan Öztürk  (Siber Güvenlik + İşletme)';
  RAISE NOTICE '';
  RAISE NOTICE 'ENSTİTÜ YÖNETİCİLERİ:';
  RAISE NOTICE '  enstmgr1@test.com  — Selin Yıldız  (Fen Bilimleri Enstitüsü)';
  RAISE NOTICE '  enstmgr2@test.com  — Murat Koç     (Sosyal Bilimler Enstitüsü)';
  RAISE NOTICE '';
  RAISE NOTICE 'PROGRAMLAR:';
  RAISE NOTICE '  Yapay Zeka ve Makine Öğrenmesi  (Fen Bil., Kota:15, TYL)';
  RAISE NOTICE '  Siber Güvenlik                  (Fen Bil., Kota:10, Doktora)';
  RAISE NOTICE '  İşletme Yönetimi                (Sosyal Bil., Kota:20, TYL-Tezsiz)';
  RAISE NOTICE '  Klinik Psikoloji                (Sosyal Bil., Kota:8, TYL)';

END $$;
