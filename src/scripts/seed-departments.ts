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

const DEPARTMENTS: { name: string; field: string }[] = [
  // Mühendislik
  { name: 'Bilgisayar Mühendisliği', field: 'Mühendislik' },
  { name: 'Elektrik-Elektronik Mühendisliği', field: 'Mühendislik' },
  { name: 'İnşaat Mühendisliği', field: 'Mühendislik' },
  { name: 'Makine Mühendisliği', field: 'Mühendislik' },
  { name: 'Endüstri Mühendisliği', field: 'Mühendislik' },
  { name: 'Çevre Mühendisliği', field: 'Mühendislik' },
  { name: 'Kimya Mühendisliği', field: 'Mühendislik' },
  { name: 'Yazılım Mühendisliği', field: 'Mühendislik' },
  { name: 'Biyomedikal Mühendisliği', field: 'Mühendislik' },
  { name: 'Metalurji ve Malzeme Mühendisliği', field: 'Mühendislik' },
  { name: 'Havacılık ve Uzay Mühendisliği', field: 'Mühendislik' },
  { name: 'Gıda Mühendisliği', field: 'Mühendislik' },
  { name: 'Jeoloji Mühendisliği', field: 'Mühendislik' },
  { name: 'Harita Mühendisliği', field: 'Mühendislik' },
  { name: 'Maden Mühendisliği', field: 'Mühendislik' },
  { name: 'Petrol ve Doğalgaz Mühendisliği', field: 'Mühendislik' },
  { name: 'Tekstil Mühendisliği', field: 'Mühendislik' },
  // Fen Bilimleri
  { name: 'Matematik', field: 'Fen Bilimleri' },
  { name: 'Fizik', field: 'Fen Bilimleri' },
  { name: 'Kimya', field: 'Fen Bilimleri' },
  { name: 'Biyoloji', field: 'Fen Bilimleri' },
  { name: 'İstatistik', field: 'Fen Bilimleri' },
  { name: 'Moleküler Biyoloji ve Genetik', field: 'Fen Bilimleri' },
  // İktisadi ve İdari Bilimler
  { name: 'İktisat', field: 'İktisadi ve İdari Bilimler' },
  { name: 'İşletme', field: 'İktisadi ve İdari Bilimler' },
  { name: 'Kamu Yönetimi', field: 'İktisadi ve İdari Bilimler' },
  { name: 'Uluslararası İlişkiler', field: 'İktisadi ve İdari Bilimler' },
  { name: 'Maliye', field: 'İktisadi ve İdari Bilimler' },
  { name: 'Çalışma Ekonomisi ve Endüstri İlişkileri', field: 'İktisadi ve İdari Bilimler' },
  { name: 'Yönetim Bilişim Sistemleri', field: 'İktisadi ve İdari Bilimler' },
  { name: 'Uluslararası Ticaret ve Lojistik', field: 'İktisadi ve İdari Bilimler' },
  // Hukuk
  { name: 'Hukuk', field: 'Hukuk' },
  // Tıp ve Sağlık
  { name: 'Tıp', field: 'Sağlık Bilimleri' },
  { name: 'Diş Hekimliği', field: 'Sağlık Bilimleri' },
  { name: 'Eczacılık', field: 'Sağlık Bilimleri' },
  { name: 'Hemşirelik', field: 'Sağlık Bilimleri' },
  { name: 'Fizyoterapi ve Rehabilitasyon', field: 'Sağlık Bilimleri' },
  { name: 'Beslenme ve Diyetetik', field: 'Sağlık Bilimleri' },
  { name: 'Sağlık Yönetimi', field: 'Sağlık Bilimleri' },
  { name: 'Tıbbi Görüntüleme Teknikleri', field: 'Sağlık Bilimleri' },
  // Eğitim
  { name: 'Bilgisayar ve Öğretim Teknolojileri Öğretmenliği', field: 'Eğitim' },
  { name: 'Matematik Öğretmenliği', field: 'Eğitim' },
  { name: 'Türkçe Öğretmenliği', field: 'Eğitim' },
  { name: 'Sınıf Öğretmenliği', field: 'Eğitim' },
  { name: 'Rehberlik ve Psikolojik Danışmanlık', field: 'Eğitim' },
  { name: 'Eğitim Bilimleri', field: 'Eğitim' },
  // Sosyal Bilimler ve Beşeri
  { name: 'Sosyoloji', field: 'Sosyal Bilimler' },
  { name: 'Psikoloji', field: 'Sosyal Bilimler' },
  { name: 'Felsefe', field: 'Sosyal Bilimler' },
  { name: 'Tarih', field: 'Sosyal Bilimler' },
  { name: 'Türk Dili ve Edebiyatı', field: 'Sosyal Bilimler' },
  { name: 'İngiliz Dili ve Edebiyatı', field: 'Sosyal Bilimler' },
  { name: 'Coğrafya', field: 'Sosyal Bilimler' },
  { name: 'Arkeoloji', field: 'Sosyal Bilimler' },
  { name: 'Sosyal Hizmet', field: 'Sosyal Bilimler' },
  { name: 'Antropoloji', field: 'Sosyal Bilimler' },
  // İletişim
  { name: 'Gazetecilik', field: 'İletişim' },
  { name: 'Radyo, Televizyon ve Sinema', field: 'İletişim' },
  { name: 'Halkla İlişkiler ve Reklamcılık', field: 'İletişim' },
  { name: 'Yeni Medya ve İletişim', field: 'İletişim' },
  // Mimarlık ve Tasarım
  { name: 'Mimarlık', field: 'Mimarlık ve Tasarım' },
  { name: 'İç Mimarlık', field: 'Mimarlık ve Tasarım' },
  { name: 'Şehir ve Bölge Planlama', field: 'Mimarlık ve Tasarım' },
  { name: 'Peyzaj Mimarlığı', field: 'Mimarlık ve Tasarım' },
  { name: 'Grafik Tasarım', field: 'Mimarlık ve Tasarım' },
  { name: 'Endüstriyel Tasarım', field: 'Mimarlık ve Tasarım' },
  // Ziraat ve Orman
  { name: 'Ziraat', field: 'Ziraat ve Orman' },
  { name: 'Orman Mühendisliği', field: 'Ziraat ve Orman' },
  { name: 'Veterinerlik', field: 'Ziraat ve Orman' },
  { name: 'Su Ürünleri', field: 'Ziraat ve Orman' },
  // Turizm ve Otelcilik
  { name: 'Turizm İşletmeciliği', field: 'Turizm' },
  { name: 'Gastronomi ve Mutfak Sanatları', field: 'Turizm' },
  { name: 'Otel Yönetimi', field: 'Turizm' },
  // Spor
  { name: 'Spor Yönetimi', field: 'Spor Bilimleri' },
  { name: 'Antrenörlük Eğitimi', field: 'Spor Bilimleri' },
  { name: 'Beden Eğitimi ve Spor Öğretmenliği', field: 'Spor Bilimleri' },
  // İlahiyat
  { name: 'İlahiyat', field: 'İlahiyat' },
  { name: 'İslam İktisadı ve Finansı', field: 'İlahiyat' },
];

async function main() {
  await ds.initialize();
  console.log('Bağlantı kuruldu. Bölümler ekleniyor...');

  const table = 'belek_graduate_admission.departments';

  const existing = await ds.query(`SELECT name FROM ${table}`);
  const existingNames = new Set(existing.map((r: any) => r.name));

  let inserted = 0;
  for (const d of DEPARTMENTS) {
    if (existingNames.has(d.name)) continue;
    await ds.query(
      `INSERT INTO ${table} (name, field) VALUES ($1, $2)`,
      [d.name, d.field],
    );
    inserted++;
  }

  console.log(`✅ ${inserted} bölüm eklendi. (${existingNames.size} zaten mevcut)`);
  await ds.destroy();
}

main().catch((e) => { console.error(e); process.exit(1); });
