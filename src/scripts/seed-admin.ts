/**
 * Admin kullanıcısı ve temel rolleri oluşturur.
 * Çalıştırmak için: npx ts-node -r tsconfig-paths/register src/scripts/seed-admin.ts
 */

import 'dotenv/config';
import { Client } from 'pg';
import * as bcrypt from 'bcrypt';

const DB_URL = process.env.DATABASE_URL ?? 'postgres://postgres:1234@localhost:5432/lisansustu';

// ─── Ayarlar — İstersen buradan değiştir ────────────────────────────────────
const ADMIN = {
  username: 'admin',
  email: 'admin@belekuni.edu.tr',
  password: 'Admin@2026!',
  firstName: 'Sistem',
  lastName: 'Yöneticisi',
};

const ROLES = [
  { name: 'admin',          description: 'Sistem yöneticisi — tam yetki' },
  { name: 'student',        description: 'Başvuru sahibi — yalnızca kendi işlemleri' },
  { name: 'Komisyon Üyesi', description: 'Atandığı programların başvurularını değerlendirir' },
];
// ────────────────────────────────────────────────────────────────────────────

async function seed() {
  const client = new Client({
    connectionString: DB_URL,
    ssl: DB_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
  });

  await client.connect();
  console.log('Veritabanına bağlandı:', DB_URL.replace(/:\/\/.*@/, '://<gizli>@'));

  try {
    // 0. Şema var mı kontrol et
    await client.query(`CREATE SCHEMA IF NOT EXISTS belek_graduate_admission`);

    // 1. Rolleri oluştur / güncelle
    for (const role of ROLES) {
      await client.query(
        `INSERT INTO belek_graduate_admission.roles (name, description, is_active)
         VALUES ($1, $2, true)
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description`,
        [role.name, role.description],
      );
      console.log(`Rol hazır: ${role.name}`);
    }

    // 2. Admin kullanıcısı var mı?
    const existing = await client.query(
      `SELECT id FROM public.users WHERE email = $1`,
      [ADMIN.email],
    );

    if (existing.rows.length > 0) {
      console.log(`Admin kullanıcısı zaten mevcut (id: ${existing.rows[0].id}). Atlanıyor.`);
      return;
    }

    // 3. Şifreyi hashle
    const passwordHash = await bcrypt.hash(ADMIN.password, 10);

    // 4. users tablosuna ekle
    const insertUser = await client.query(
      `INSERT INTO public.users
         (username, email, password_hash, first_name, last_name,
          user_type, is_active, is_email_verified, role, create_date)
       VALUES ($1, $2, $3, $4, $5, 'admin', true, true, 'admin', NOW())
       RETURNING id`,
      [ADMIN.username, ADMIN.email, passwordHash, ADMIN.firstName, ADMIN.lastName],
    );

    const userId: number = insertUser.rows[0].id;
    console.log(`Admin kullanıcısı oluşturuldu (id: ${userId})`);

    // 5. user_auth tablosuna ekle
    await client.query(
      `INSERT INTO public.user_auth
         (user_id, password_hash, must_change_password, is_staff, is_superuser, created_at)
       VALUES ($1, $2, false, true, true, NOW())`,
      [userId, passwordHash],
    );
    console.log('user_auth kaydı oluşturuldu');

    console.log('\n✓ Seed tamamlandı!');
    console.log('─────────────────────────────');
    console.log('  E-posta :', ADMIN.email);
    console.log('  Şifre   :', ADMIN.password);
    console.log('─────────────────────────────');
    console.log('Uyarı: İlk girişten sonra şifrenizi değiştirin.');

  } finally {
    await client.end();
  }
}

seed().catch((err) => {
  console.error('Seed hatası:', err.message);
  process.exit(1);
});
