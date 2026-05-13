-- Tarihleri gün sonu 23:59:59 olarak güncelle (timezone sorununu önler)
UPDATE belek_graduate_admission.programs
SET
  "ApplicationStartdate" = '2026-01-01 00:00:00',
  "ApplicationEnddate"   = '2026-12-31 23:59:59',
  "EvaluationDate"       = '2027-01-15 00:00:00'
WHERE deleted_at IS NULL;

SELECT id, name, "ApplicationStartdate", "ApplicationEnddate",
       NOW() < "ApplicationEnddate" AS is_open
FROM belek_graduate_admission.programs
WHERE deleted_at IS NULL;
