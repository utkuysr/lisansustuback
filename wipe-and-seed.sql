-- Wipe all data (except roles) and create a single admin user
-- Password: Admin1234!

-- 1. Clear all domain + user data, preserve roles
TRUNCATE TABLE
  belek_graduate_admission.application_documents,
  belek_graduate_admission.decisions,
  belek_graduate_admission.notifications,
  belek_graduate_admission.program_commissioners,
  belek_graduate_admission.program_rankings,
  belek_graduate_admission.interviews,
  belek_graduate_admission.applications,
  belek_graduate_admission.institute_managers,
  belek_graduate_admission.programs,
  belek_graduate_admission.departments,
  belek_graduate_admission.faculties,
  belek_graduate_admission.universities,
  belek_graduate_admission.institutes,
  public.user_auth,
  public.users
CASCADE;

-- 2. Insert admin user (role col stores role name as FK to roles.name)
INSERT INTO public.users (
  email,
  password_hash,
  first_name,
  last_name,
  user_type,
  is_active,
  is_email_verified,
  email_verified_at,
  create_date,
  role
) VALUES (
  'admin@admin.com',
  '$2b$10$PDagpCLPnYn9tJFtc2hoGeYxaajxFCPSjALkMS93WIQShqeg.yGVu',
  'Admin',
  'User',
  'admin',
  true,
  true,
  NOW(),
  NOW(),
  'admin'
) RETURNING id;

-- 3. Insert user_auth record for the admin user
INSERT INTO public.user_auth (user_id, is_staff, is_superuser, created_at)
SELECT id, true, true, NOW() FROM public.users WHERE email = 'admin@admin.com';

SELECT 'Done! Admin user created.' AS result;
SELECT id, email, first_name, last_name, role FROM public.users;
