/**
 * Test kullanıcıları, üniversite ve enstitü oluşturur.
 * Çalıştırmak için:
 *   npx ts-node -r tsconfig-paths/register src/scripts/seed-test-users.ts
 */

import 'dotenv/config';
import { Client } from 'pg';
import * as bcrypt from 'bcrypt';

const DB_URL =
  process.env.DATABASE_URL ?? 'postgres://postgres:1234@localhost:5432/lisansustu';

const PASSWORD_HASH_ROUNDS = 10;

// ── Kullanıcılar ─────────────────────────────────────────────────────────────
const USERS: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string; // roles tablosundaki name
}[] = [
  // Enstitü Yöneticisi
  {
    email: 'yonetici@belekuni.edu.tr',
    password: 'Manager@2026!',
    firstName: 'Ayşe',
    lastName: 'Kaya',
    role: 'institute_manager',
  },
  // Komisyon Üyeleri
  {
    email: 'komisyon1@belekuni.edu.tr',
    password: 'Komisyon@2026!',
    firstName: 'Mehmet',
    lastName: 'Yılmaz',
    role: 'Komisyon Üyesi',
  },
  {
    email: 'komisyon2@belekuni.edu.tr',
    password: 'Komisyon@2026!',
    firstName: 'Fatma',
    lastName: 'Demir',
    role: 'Komisyon Üyesi',
  },
  // Öğrenciler
  {
    email: 'ogrenci1@gmail.com',
    password: 'Ogrenci@2026!',
    firstName: 'Ali',
    lastName: 'Çelik',
    role: 'student',
  },
  {
    email: 'ogrenci2@gmail.com',
    password: 'Ogrenci@2026!',
    firstName: 'Zeynep',
    lastName: 'Arslan',
    role: 'student',
  },
  {
    email: 'ogrenci3@gmail.com',
    password: 'Ogrenci@2026!',
    firstName: 'Emre',
    lastName: 'Şahin',
    role: 'student',
  },
];

async function main() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  console.log('Veritabanına bağlandı.\n');

  try {
    // ── 1. Eksik rol: institute_manager ────────────────────────────────────────
    await client.query(
      `INSERT INTO belek_graduate_admission.roles (name, description, is_active)
       VALUES ('institute_manager', 'Enstitü yöneticisi — programları ve başvuruları yönetir', true)
       ON CONFLICT (name) DO NOTHING`,
    );
    console.log('✓ Rol hazır: institute_manager');

    // ── 2. Test üniversitesi ───────────────────────────────────────────────────
    const uniRes = await client.query(
      `INSERT INTO belek_graduate_admission.universities (name, city, type, short_name)
       VALUES ('Belek Üniversitesi', 'Antalya', 'devlet', 'BEL')
       ON CONFLICT DO NOTHING
       RETURNING id`,
    );
    let universityId: number;
    if (uniRes.rows.length > 0) {
      universityId = uniRes.rows[0].id;
      console.log(`✓ Üniversite oluşturuldu (id: ${universityId})`);
    } else {
      const existing = await client.query(
        `SELECT id FROM belek_graduate_admission.universities WHERE name = 'Belek Üniversitesi'`,
      );
      universityId = existing.rows[0].id;
      console.log(`✓ Üniversite zaten mevcut (id: ${universityId})`);
    }

    // ── 3. Test enstitüsü ──────────────────────────────────────────────────────
    const instRes = await client.query(
      `INSERT INTO belek_graduate_admission.institutes (name, university_id, created_at)
       VALUES ('Fen Bilimleri Enstitüsü', $1, NOW())
       RETURNING id`,
      [universityId],
    );
    const instituteId: number = instRes.rows[0].id;
    console.log(`✓ Enstitü oluşturuldu (id: ${instituteId})`);

    // ── 4. Kullanıcıları oluştur ───────────────────────────────────────────────
    const createdUsers: { id: number; email: string; role: string }[] = [];

    for (const u of USERS) {
      // Daha önce oluşturulmuş mu?
      const exists = await client.query(
        `SELECT id FROM public.users WHERE email = $1`,
        [u.email],
      );
      if (exists.rows.length > 0) {
        console.log(`  Atlandı (zaten var): ${u.email}`);
        createdUsers.push({ id: exists.rows[0].id, email: u.email, role: u.role });
        continue;
      }

      const hash = await bcrypt.hash(u.password, PASSWORD_HASH_ROUNDS);

      const inserted = await client.query(
        `INSERT INTO public.users
           (email, password_hash, first_name, last_name,
            user_type, is_active, is_email_verified, role, create_date)
         VALUES ($1,$2,$3,$4,$5,true,true,$5,NOW())
         RETURNING id`,
        [u.email, hash, u.firstName, u.lastName, u.role],
      );
      const userId: number = inserted.rows[0].id;

      await client.query(
        `INSERT INTO public.user_auth
           (user_id, password_hash, must_change_password, is_staff, is_superuser, created_at)
         VALUES ($1,$2,false,false,false,NOW())`,
        [userId, hash],
      );

      createdUsers.push({ id: userId, email: u.email, role: u.role });
      console.log(`  ✓ Oluşturuldu: ${u.email} [${u.role}] (id: ${userId})`);
    }

    // ── 5. Enstitü yöneticisini institute_managers tablosuna bağla ─────────────
    const managerUser = createdUsers.find((u) => u.role === 'institute_manager');
    if (managerUser) {
      const alreadyLinked = await client.query(
        `SELECT id FROM belek_graduate_admission.institute_managers
         WHERE institute_id = $1`,
        [instituteId],
      );
      if (alreadyLinked.rows.length === 0) {
        await client.query(
          `INSERT INTO belek_graduate_admission.institute_managers
             (user_id, institute_id, created_at)
           VALUES ($1,$2,NOW())`,
          [managerUser.id, instituteId],
        );
        console.log(`✓ Yönetici enstitüye atandı`);
      } else {
        console.log(`  Yönetici atama zaten mevcut, atlandı`);
      }
    }

    // ── Özet ──────────────────────────────────────────────────────────────────
    console.log('\n✅  Test kullanıcıları hazır!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('  ROL                   E-POSTA                    ŞİFRE');
    console.log('───────────────────────────────────────────────────────');
    console.log('  admin                 admin@belekuni.edu.tr       Admin@2026!');
    console.log('  institute_manager     yonetici@belekuni.edu.tr   Manager@2026!');
    console.log('  Komisyon Üyesi        komisyon1@belekuni.edu.tr   Komisyon@2026!');
    console.log('  Komisyon Üyesi        komisyon2@belekuni.edu.tr   Komisyon@2026!');
    console.log('  student               ogrenci1@gmail.com          Ogrenci@2026!');
    console.log('  student               ogrenci2@gmail.com          Ogrenci@2026!');
    console.log('  student               ogrenci3@gmail.com          Ogrenci@2026!');
    console.log('═══════════════════════════════════════════════════════');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('\n❌  Hata:', err.message);
  process.exit(1);
});
