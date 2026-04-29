import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'universities', schema: 'belek_graduate_admission' })
export class University {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 300 })
  name: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ length: 10, default: 'devlet' })
  type: string; // 'devlet' | 'vakıf'

  @Column({ name: 'short_name', length: 50, nullable: true })
  shortName: string;
}
