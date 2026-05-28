import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, DeleteDateColumn } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Institute } from 'src/institute/entities/institute.entity';

@Entity({ name: 'institute_managers', schema: 'belek_graduate_admission' })
export class InstituteManager {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Institute, { eager: true })
  @JoinColumn({ name: 'institute_id' })
  institute: Institute;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
