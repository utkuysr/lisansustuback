import { User } from 'src/users/entities/user.entity';
import { Department } from 'src/departments/entities/department.entity';
import { Institute } from 'src/institute/entities/institute.entity';
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

export enum DegreeType {
  TEZLI_YUKSEK_LISANS = 'tezli_yuksek_lisans',
  TEZSIZ_YUKSEK_LISANS = 'tezsiz_yuksek_lisans',
  DOKTORA = 'doktora',
}

@Entity({ name: 'programs', schema: 'belek_graduate_admission' })
export class Program {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 255 })
    name: string;

    @Column()
    Quota: number;

    @Column({ nullable: true })
    Description?: string;

    @Column()
    ApplicationStartdate: Date;

    @Column()
    ApplicationEnddate: Date;

    @Column()
    EvaluationDate: Date;

    @Column({ name: 'degree_type', length: 30, default: DegreeType.TEZLI_YUKSEK_LISANS })
    degreeType: string;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    // Minimum score requirements
    @Column({ name: 'min_ales_score', type: 'float', nullable: true })
    minAlesScore?: number;

    @Column({ name: 'min_gpa', type: 'float', nullable: true })
    minGpa?: number;

    @Column({ name: 'min_language_score', type: 'float', nullable: true })
    minLanguageScore?: number;

    @Column({ name: 'language_exam_required', default: false })
    languageExamRequired: boolean;

    // Scoring weights
    @Column({ name: 'ales_weight', type: 'int', nullable: true })
    alesWeight?: number;

    @Column({ name: 'gpa_weight', type: 'int', nullable: true })
    gpaWeight?: number;

    @Column({ name: 'interview_weight', type: 'int', nullable: true })
    interviewWeight?: number;

    @Column({ name: 'written_exam_weight', type: 'int', nullable: true })
    writtenExamWeight?: number;

    // Written exam (Bilim Sınavı)
    @Column({ name: 'has_written_exam', default: false })
    hasWrittenExam: boolean;

    @Column({ name: 'written_exam_date', type: 'timestamp', nullable: true })
    writtenExamDate?: Date;

    @Column({ name: 'written_exam_min_score', type: 'float', nullable: true })
    writtenExamMinScore?: number;

    // Interview (Mülakat)
    @Column({ name: 'has_interview', default: false })
    hasInterview: boolean;

    @Column({ name: 'interview_date', type: 'timestamp', nullable: true })
    interviewDate?: Date;

    @Column({ name: 'interview_min_score', type: 'float', nullable: true })
    interviewMinScore?: number;

    @Column({ name: 'jury_size', type: 'int', nullable: true })
    jurySize?: number;

    @Column({ name: 'main_list_count', type: 'int', nullable: true })
    mainListCount?: number;

    @Column({ name: 'backup_list_count', type: 'int', nullable: true })
    backupListCount?: number;

    @Column({ name: 'requirements', type: 'text', nullable: true })
    requirements?: string;

    @ManyToOne(() => Department, { eager: true, nullable: true })
    @JoinColumn({ name: 'department_id' })
    department?: Department;

    @ManyToOne(() => Institute, { eager: true, nullable: true })
    @JoinColumn({ name: 'institute_id' })
    institute?: Institute;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'createdBy' })
    createdBy: User;

    @CreateDateColumn({ name: 'created_at', nullable: true })
    createdAt?: Date;

    @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
    updatedAt?: Date;

    @Column({ name: 'updated_by', type: 'int', nullable: true })
    updatedBy?: number;

    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    deletedAt?: Date;
}
