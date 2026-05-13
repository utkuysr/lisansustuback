-- Komisyon atamaları
SELECT pc.id, u.email as commissioner, p.name as program, p.id as program_id
FROM belek_graduate_admission.program_commissioners pc
JOIN public.users u ON u.id = pc."commissionerId"
JOIN belek_graduate_admission.programs p ON p.id = pc."programId"
ORDER BY p.id;

-- Mevcut kararlar
SELECT d.id, uc.email as commissioner, p.name as program, ua.email as applicant, d.status, d.score
FROM belek_graduate_admission.decisions d
JOIN public.users uc ON uc.id = d."commissionerId"
JOIN belek_graduate_admission.applications a ON a.id = d."applicationId"
JOIN public.users ua ON ua.id = a."userId"
JOIN belek_graduate_admission.programs p ON p.id = a."programId"
ORDER BY p.id, d.id;
