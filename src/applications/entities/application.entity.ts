import { Program } from 'src/programs/entities/program.entity';
import { User } from 'src/users/entities/user.entity';
import { University } from 'src/universities/entities/university.entity';
import { Department } from 'src/departments/entities/department.entity';
import { Column, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Decision } from 'src/decision/entities/decision.entity';
import { ApplicationDocument } from 'src/documents/entities/application-document.entity';

export enum ApplicationStatus {
    DRAFT = 'draft',
    SUBMITTED = 'submitted',
    UNDER_REVIEW = 'under_review',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
    WAITLISTED = 'waitlisted',
}

@Entity({ name: 'applications', schema: 'belek_graduate_admission' })
export class Application {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'application_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    ApplicationDate: Date;

    @Column({ type: 'enum', enum: ApplicationStatus, default: ApplicationStatus.DRAFT })
    status: ApplicationStatus;

    @Column({ type: 'float', nullable: true })
    GradePointAverage: number;

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

    @Column({ name: 'created_at', type: 'timestamp', nullable: true })
    createdAt?: Date;

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
