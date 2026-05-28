import { Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn, Column, DeleteDateColumn } from 'typeorm';
import { Application } from 'src/applications/entities/application.entity';
import { User } from 'src/users/entities/user.entity';

export enum DecisionStatus {
    PENDING_REVIEW = 'pending_review',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
    WAITLISTED = 'waitlisted',
    INTERVIEW_REQUIRED = 'interview_required',
}

@Entity({ name: 'decisions', schema: 'belek_graduate_admission' })
export class Decision {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'decision_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    decisionDate: Date;

    @Column({ type: 'enum', enum: DecisionStatus, default: DecisionStatus.PENDING_REVIEW })
    status: DecisionStatus;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ type: 'float', nullable: true })
    score: number;

    @ManyToOne(() => Application, (app) => app.decisions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'applicationId' })
    application: Application;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'commissionerId' })
    commissioner: User;

    @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
    updatedAt?: Date;

    @Column({ name: 'updated_by', type: 'int', nullable: true })
    updatedBy?: number;

    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    deletedAt?: Date;
}
