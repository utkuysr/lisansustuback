import { Application } from 'src/applications/entities/application.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

export enum InterviewStatus {
    SCHEDULED = 'scheduled',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    NO_SHOW = 'no_show',
}

@Entity({ name: 'interviews', schema: 'belek_graduate_admission' })
export class Interview {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Application, { onDelete: 'CASCADE', eager: false })
    @JoinColumn({ name: 'application_id' })
    application: Application;

    @Column({ name: 'application_id', insert: false, update: false })
    applicationId: number;

    @Column({ name: 'scheduled_at', type: 'timestamp' })
    scheduledAt: Date;

    @Column({ type: 'enum', enum: InterviewStatus, default: InterviewStatus.SCHEDULED })
    status: InterviewStatus;

    @Column({ length: 500, nullable: true })
    location?: string;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @Column({ type: 'float', nullable: true })
    score?: number;

    @ManyToOne(() => User, { eager: true, nullable: true })
    @JoinColumn({ name: 'interviewer_id' })
    interviewer?: User;

    @Column({ name: 'created_by', type: 'int', nullable: true })
    createdBy?: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
    updatedAt?: Date;

    @Column({ name: 'updated_by', type: 'int', nullable: true })
    updatedBy?: number;
}
