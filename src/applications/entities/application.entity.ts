import { Program } from 'src/programs/entities/program.entity';
import { User } from 'src/users/entities/user.entity';
import { University } from 'src/universities/entities/university.entity';
import { Department } from 'src/departments/entities/department.entity';
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Decision } from 'src/decision/entities/decision.entity';
import { ApplicationDocument } from 'src/documents/entities/application-document.entity';

export enum ApplicationStatus {
    DRAFT = 'draft',
    SUBMITTED = 'submitted',
    UNDER_REVIEW = 'under_review',
    INTERVIEW_REQUIRED = 'interview_required',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
    WAITLISTED = 'waitlisted',
}

export const VALID_STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
    [ApplicationStatus.DRAFT]: [ApplicationStatus.SUBMITTED],
    [ApplicationStatus.SUBMITTED]: [ApplicationStatus.UNDER_REVIEW],
    [ApplicationStatus.UNDER_REVIEW]: [ApplicationStatus.INTERVIEW_REQUIRED, ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED, ApplicationStatus.WAITLISTED],
    [ApplicationStatus.INTERVIEW_REQUIRED]: [ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED, ApplicationStatus.WAITLISTED],
    [ApplicationStatus.ACCEPTED]: [],
    [ApplicationStatus.REJECTED]: [],
    [ApplicationStatus.WAITLISTED]: [ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED],
};

@Entity({ name: 'applications', schema: 'belek_graduate_admission' })
export class Application {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'application_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    ApplicationDate: Date;

    @Column({ type: 'enum', enum: ApplicationStatus, default: ApplicationStatus.DRAFT })
    status: ApplicationStatus;

    @Column({ type: 'float', nullable: true })
    GradePointAverage?: number;

    @Column({ name: 'gpa_scale', length: 5, default: '4.0' })
    gpaScale: string;

    @Column({ name: 'ales_score', type: 'float', nullable: true })
    alesScore?: number;

    @Column({ name: 'yds_score', type: 'float', nullable: true })
    ydsScore?: number;

    @Column({ name: 'degree_type', length: 30, nullable: true })
    degreeType?: string;

    @Column({ name: 'graduate_university', length: 255, nullable: true })
    graduateUniversity?: string;

    @Column({ name: 'graduate_faculty', length: 255, nullable: true })
    graduateFaculty?: string;

    @Column({ name: 'graduate_department', length: 255, nullable: true })
    graduateDepartment?: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @ManyToOne(() => Program, { eager: true })
    @JoinColumn({ name: 'programId' })
    program: Program;

    @ManyToOne(() => University, { eager: true, nullable: true })
    @JoinColumn({ name: 'university_id' })
    university?: University;

    @ManyToOne(() => Department, { eager: true, nullable: true })
    @JoinColumn({ name: 'department_id' })
    department?: Department;

    @OneToMany(() => Decision, (d) => d.application)
    decisions?: Decision[];

    @OneToMany(() => ApplicationDocument, (doc) => doc.application)
    documents?: ApplicationDocument[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
    updatedAt?: Date;

    @Column({ name: 'updated_by', type: 'int', nullable: true })
    updatedBy?: number;

    @DeleteDateColumn({ name: 'archived_at', nullable: true })
    archivedAt?: Date;

    @Column({ name: 'archived_by', type: 'int', nullable: true })
    archivedBy?: number;

    @Column({ name: 'archive_reason', length: 500, nullable: true })
    archiveReason?: string;
}
