SELECT
  id, name, is_active,
  "ApplicationStartdate" AS start_dt,
  "ApplicationEnddate"   AS end_dt,
  NOW()                  AS now_dt,
  NOW() < "ApplicationEnddate" AS is_open
FROM belek_graduate_admission.programs
WHERE deleted_at IS NULL
ORDER BY id;
