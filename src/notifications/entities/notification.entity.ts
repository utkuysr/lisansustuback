import { User } from 'src/users/entities/user.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

export enum NotificationType {
  APPLICATION_SUBMITTED = 'application_submitted',
  APPLICATION_UNDER_REVIEW = 'application_under_review',
  APPLICATION_ACCEPTED = 'application_accepted',
  APPLICATION_REJECTED = 'application_rejected',
  APPLICATION_WAITLISTED = 'application_waitlisted',
  APPLICATION_INTERVIEW_REQUIRED = 'application_interview_required',
  DECISION_MADE = 'decision_made',
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  GENERAL = 'general',
}

@Entity({ name: 'notifications', schema: 'belek_graduate_admission' })
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', insert: false, update: false })
  userId: number;

  @Column({ length: 60, default: NotificationType.GENERAL })
  type: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt?: Date;
}
