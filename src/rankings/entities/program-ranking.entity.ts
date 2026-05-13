import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, CreateDateColumn } from 'typeorm';
import { Program } from 'src/programs/entities/program.entity';
import { User } from 'src/users/entities/user.entity';

export type RankingStatus = 'pending_approval' | 'approved' | 'interview_phase';

export interface RankingEntry {
  applicationId: number;
  rank: number;
  totalScore: number;
  commissionerScore: number;
  interviewScore?: number;
  gpa: number;
  alesScore: number;
  ydsScore: number;
  decision: 'accepted' | 'waitlisted' | 'rejected';
  overridden?: boolean;
  applicantName: string;
  applicantEmail: string;
  graduateUniversity?: string;
  graduateFaculty?: string;
  graduateDepartment?: string;
}

@Entity({ name: 'program_rankings', schema: 'belek_graduate_admission' })
export class ProgramRanking {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Program, { eager: true })
  @JoinColumn({ name: 'program_id' })
  program: Program;

  @Column({ type: 'enum', enum: ['pending_approval', 'approved', 'interview_phase'], default: 'pending_approval' })
  status: RankingStatus;

  @Column({ type: 'jsonb', nullable: true })
  rankingData: RankingEntry[];

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'approved_by_id' })
  approvedBy?: User;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt?: Date;
}
