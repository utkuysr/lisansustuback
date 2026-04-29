import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'departments', schema: 'belek_graduate_admission' })
export class Department {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 300 })
  name: string;

  @Column({ length: 100, nullable: true })
  field: string; // Alan: Mühendislik, Sağlık, Sosyal Bilimler vb.
}
