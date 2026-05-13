import { University } from 'src/universities/entities/university.entity';
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'faculties', schema: 'belek_graduate_admission' })
export class Faculty {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 300 })
  name: string;

  @Column({ length: 500, nullable: true })
  description?: string;

  @ManyToOne(() => University, { nullable: true, eager: true })
  @JoinColumn({ name: 'university_id' })
  university?: University;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
