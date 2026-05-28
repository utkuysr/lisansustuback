/**
 * Veritabanını tamamen sıfırlar ve sadece bir admin kullanıcısı oluşturur.
 * Çalıştırmak için:
 *   npx ts-node -r tsconfig-paths/register src/scripts/reset-and-seed.ts
 */

import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Client } from 'pg';
import * as bcrypt from 'bcrypt';

import { User } from '../users/entities/user.entity';
import { UserAuth } from '../auth/entities/user-auth.entity';
import { Role } from '../roles/entities/role.entity';
import { University } from '../universities/entities/university.entity';
import { Faculty } from '../faculties/entities/faculty.entity';
import { Department } from '../departments/entities/department.entity';
import { Institute } from '../institute/entities/institute.entity';
import { Program } from '../programs/entities/program.entity';
import { ProgramCommissioner } from '../programs/entities/program-commissioner.entity';
import { Application } from '../applications/entities/application.entity';
import { ApplicationDocument } from '../documents/entities/application-document.entity';
import { Decision } from '../decision/entities/decision.entity';
import { Interview } from '../interviews/entities/interview.entity';
import { ProgramRanking } from '../rankings/entities/program-ranking.entity';
import { InstituteManager } from '../institute-managers/entities/institute-manager.entity';
import { Notification } from '../notifications/entities/notification.entity';

const DB_URL =
  process.env.DATABASE_URL ?? 'postgres://postgres:1234@localhost:5432/lisansustu';

const ADMIN = {
  email: 'admin@belekuni.edu.tr',
  password: 'Admin@2026!',
  firstName: 'Sistem',
  lastName: 'Yöneticisi',
};

async function main() {
  // ── 1. Tüm tabloları sil ────────────────────────────────────────────────────
  console.log('\n🗑️  Veritabanı sıfırlanıyor...');
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  try {
    await client.query('DROP SCHEMA IF EXISTS belek_graduate_admission CASCADE');
    await client.query('DROP TABLE IF EXISTS public.user_auth CASCADE');
    await client.query('DROP TABLE IF EXISTS public.users CASCADE');
    console.log('✓ Tüm tablolar silindi');
  } finally {
    await client.end();
  }

  // ── 2. TypeORM ile şema + tabloları yeniden oluştur ─────────────────────────
  console.log('\n🔧  Tablolar yeniden oluşturuluyor...');
  const ds = new DataSource({
    type: 'postgres',
    url: DB_URL,
    entities: [
      User,
      UserAuth,
      Role,
      University,
      Faculty,
      Department,
      Institute,
      Program,
      ProgramCommissioner,
      Application,
      ApplicationDocument,
      Decision,
      Interview,
      ProgramRanking,
      InstituteManager,
      Notification,
    ],
    synchronize: false,
  });

  await ds.initialize();
  await ds.query('CREATE SCHEMA IF NOT EXISTS belek_graduate_admission');
  await ds.synchronize();
  console.log('✓ Tablolar oluşturuldu');

  // ── 3. Rolleri ekle ─────────────────────────────────────────────────────────
  const roles = [
    { name: 'admin',          description: 'Sistem yöneticisi — tam yetki' },
    { name: 'student',        description: 'Başvuru sahibi — yalnızca kendi işlemleri' },
    { name: 'Komisyon Üyesi', description: 'Atandığı programların başvurularını değerlendirir' },
  ];
  for (const r of roles) {
    await ds.query(
      `INSERT INTO belek_graduate_admission.roles (name, description, is_active)
       VALUES ($1, $2, true)`,
      [r.name, r.description],
    );
  }
  console.log('✓ Roller oluşturuldu');

  // ── 4. Admin kullanıcısı oluştur ────────────────────────────────────────────
  const hash = await bcrypt.hash(ADMIN.password, 10);

  const [{ id: userId }] = await ds.query(
    `INSERT INTO public.users
       (email, password_hash, first_name, last_name,
        user_type, is_active, is_email_verified, role, create_date)
     VALUES ($1,$2,$3,$4,'admin',true,true,'admin',NOW())
     RETURNING id`,
    [ADMIN.email, hash, ADMIN.firstName, ADMIN.lastName],
  );

  await ds.query(
    `INSERT INTO public.user_auth
       (user_id, password_hash, must_change_password, is_staff, is_superuser, created_at)
     VALUES ($1,$2,false,true,true,NOW())`,
    [userId, hash],
  );
  console.log(`✓ Admin kullanıcısı oluşturuldu (id: ${userId})`);

  await ds.destroy();

  console.log('\n✅  Sıfırlama tamamlandı!');
  console.log('─────────────────────────────────────');
  console.log('  E-posta :', ADMIN.email);
  console.log('  Şifre   :', ADMIN.password);
  console.log('─────────────────────────────────────');
}

main().catch((err) => {
  console.error('\n❌  Hata:', err.message);
  process.exit(1);
});
