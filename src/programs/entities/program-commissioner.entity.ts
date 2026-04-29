import { Entity, ManyToOne, PrimaryGeneratedColumn, Unique, Index, JoinColumn, Column } from 'typeorm';
import { Program } from './program.entity';
import { User } from 'src/users/entities/user.entity';

@Entity({ name: 'program_commissioners', schema: 'belek_graduate_admission' })
@Unique('uq_program_commissioner', ['program', 'commissioner'])
export class ProgramCommissioner {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @ManyToOne(() => Program, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'program_id' })
  program: Program;

  @Index()
  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'commissioner_id' })
  commissioner: User;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}

