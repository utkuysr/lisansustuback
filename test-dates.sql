-- Program 1, 2: Başvuru dönemi kapandı, değerlendirme açık → komisyon karar verebilir
UPDATE belek_graduate_admission.programs
SET
  "ApplicationStartdate" = '2026-02-01 00:00:00',
  "ApplicationEnddate"   = '2026-04-30 23:59:59',
  "EvaluationDate"       = '2026-07-31 23:59:59'
WHERE id IN (1, 2);

-- Program 3, 4, 5: Başvuru dönemi açık → öğrenci başvurabilir
UPDATE belek_graduate_admission.programs
SET
  "ApplicationStartdate" = '2026-01-01 00:00:00',
  "ApplicationEnddate"   = '2026-12-31 23:59:59',
  "EvaluationDate"       = '2027-03-31 23:59:59'
WHERE id IN (3, 4, 5);

-- Sonucu doğrula
SELECT
  id, name,
  "ApplicationEnddate" AS end_dt,
  "EvaluationDate"     AS eval_dt,
  NOW()                AS now_dt,
  NOW() > "ApplicationEnddate" AND NOW() < "EvaluationDate" AS can_evaluate,
  NOW() < "ApplicationEnddate" AS is_open_for_apps
FROM belek_graduate_admission.programs
WHERE deleted_at IS NULL
ORDER BY id;
