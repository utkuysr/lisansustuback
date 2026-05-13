SELECT a.id, u.email, p.name as program, a.status
FROM belek_graduate_admission.applications a
JOIN public.users u ON u.id = a."userId"
JOIN belek_graduate_admission.programs p ON p.id = a."programId"
WHERE a.archived_at IS NULL
ORDER BY p.id, a.id;
