import * as dotenv from 'dotenv';
dotenv.config();
import { DataSource } from 'typeorm';

const url = process.env.DATABASE_URL ?? 'postgres://postgres:1234@localhost:5432/lisansustu';

const ds = new DataSource({
  type: 'postgres',
  url,
  ssl: url.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
  synchronize: false,
});

const FACULTIES: { name: string; description: string }[] = [
  {
    name: 'Fen-Edebiyat Fakültesi',
    description: 'Matematik, fizik, kimya, biyoloji, tarih, felsefe, Türk dili ve edebiyatı gibi temel bilim ve beşerî disiplinleri kapsar.',
  },
  {
    name: 'Mühendislik Fakültesi',
    description: 'Bilgisayar, elektrik-elektronik, inşaat, makine, endüstri ve çevre mühendisliği bölümlerini kapsar.',
  },
  {
    name: 'Mimarlık Fakültesi',
    description: 'Mimarlık, iç mimarlık, şehir ve bölge planlama ile peyzaj mimarlığı programlarını sunar.',
  },
  {
    name: 'İktisadi ve İdari Bilimler Fakültesi',
    description: 'İktisat, işletme, kamu yönetimi, uluslararası ilişkiler ve çalışma ekonomisi bölümlerini içerir.',
  },
  {
    name: 'İşletme Fakültesi',
    description: 'İşletme yönetimi, yönetim bilişim sistemleri ve girişimcilik alanlarında eğitim verir.',
  },
  {
    name: 'Hukuk Fakültesi',
    description: 'Kamu hukuku ve özel hukuk alanlarında lisans ve lisansüstü eğitim sunar.',
  },
  {
    name: 'Tıp Fakültesi',
    description: 'Temel tıp bilimleri, dahiliye ve cerrahi bilimler ile klinik tıp eğitimini kapsar.',
  },
  {
    name: 'Diş Hekimliği Fakültesi',
    description: 'Ağız, diş ve çene sağlığı alanında eğitim verir.',
  },
  {
    name: 'Eczacılık Fakültesi',
    description: 'Eczacılık bilimleri, farmakoloji ve klinik eczacılık programlarını sunar.',
  },
  {
    name: 'Sağlık Bilimleri Fakültesi',
    description: 'Hemşirelik, fizyoterapi, beslenme ve diyetetik, sağlık yönetimi bölümlerini kapsar.',
  },
  {
    name: 'Eğitim Fakültesi',
    description: 'Öğretmenlik lisans programları, eğitim bilimleri ve pedagoji alanlarında eğitim verir.',
  },
  {
    name: 'Güzel Sanatlar Fakültesi',
    description: 'Resim, heykel, grafik tasarım ve tekstil-moda tasarımı bölümlerini içerir.',
  },
  {
    name: 'Güzel Sanatlar ve Tasarım Fakültesi',
    description: 'Görsel sanatlar, endüstriyel tasarım ve iletişim tasarımı programlarını kapsar.',
  },
  {
    name: 'İletişim Fakültesi',
    description: 'Gazetecilik, radyo-televizyon-sinema, halkla ilişkiler ve reklamcılık bölümlerini sunar.',
  },
  {
    name: 'İlahiyat Fakültesi',
    description: "İslam bilimleri, Kur'an-ı Kerim ve dinler tarihi alanlarında eğitim verir.",
  },
  {
    name: 'Siyasal Bilgiler Fakültesi',
    description: 'Siyaset bilimi, uluslararası ilişkiler, kamu yönetimi ve sosyal politika programlarını sunar.',
  },
  {
    name: 'Ziraat Fakültesi',
    description: 'Tarım, bitki koruma, tarım ekonomisi, toprak bilimi ve gıda mühendisliği alanlarında eğitim verir.',
  },
  {
    name: 'Veteriner Fakültesi',
    description: 'Hayvan sağlığı, hastalıkları ve veteriner klinik bilimleri alanlarında eğitim sunar.',
  },
  {
    name: 'Su Ürünleri Fakültesi',
    description: 'Balıkçılık teknolojisi, su ürünleri yetiştiriciliği ve su ürünleri işleme teknolojisi programlarını içerir.',
  },
  {
    name: 'Orman Fakültesi',
    description: 'Orman mühendisliği, orman endüstrisi ve çevre yönetimi alanlarında eğitim verir.',
  },
  {
    name: 'Spor Bilimleri Fakültesi',
    description: 'Spor yönetimi, antrenörlük eğitimi, beden eğitimi ve spor öğretmenliği programlarını sunar.',
  },
  {
    name: 'Turizm Fakültesi',
    description: 'Turizm işletmeciliği, otel yönetimi ve gastronomi-mutfak sanatları bölümlerini kapsar.',
  },
  {
    name: 'Hemşirelik Fakültesi',
    description: 'Hemşirelik lisans ve lisansüstü programları ile klinik hemşirelik eğitimini sunar.',
  },
  {
    name: 'Teknoloji Fakültesi',
    description: 'Uygulamalı mühendislik ve teknoloji programlarını kapsar.',
  },
  {
    name: 'Sosyal Bilimler Fakültesi',
    description: 'Sosyoloji, psikoloji, sosyal hizmet ve antropoloji programlarını sunar.',
  },
];

async function main() {
  await ds.initialize();
  console.log('Bağlantı kuruldu. Fakülteler ekleniyor...');

  const table = 'belek_graduate_admission.faculties';

  const existing = await ds.query(`SELECT name FROM ${table} WHERE deleted_at IS NULL`);
  const existingNames = new Set(existing.map((r: any) => r.name));

  let inserted = 0;
  for (const f of FACULTIES) {
    if (existingNames.has(f.name)) continue;
    await ds.query(
      `INSERT INTO ${table} (name, description, created_at) VALUES ($1, $2, NOW())`,
      [f.name, f.description],
    );
    inserted++;
  }

  console.log(`✅ ${inserted} fakülte eklendi. (${existingNames.size} zaten mevcut)`);
  await ds.destroy();
}

main().catch((e) => { console.error(e); process.exit(1); });
