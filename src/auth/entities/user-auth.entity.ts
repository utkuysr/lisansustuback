import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { User } from 'src/users/entities/user.entity';

@Entity({ name: 'user_auth', schema: 'public' })
export class UserAuth {
    @PrimaryColumn({ name: 'user_id' })
    userId: number;

    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Exclude()
    @Column({ name: 'password_hash', length: 255, nullable: true })
    passwordHash: string;

    @Exclude()
    @Column({ name: 'password_reset_token', length: 255, nullable: true })
    passwordResetToken: string;

    @Column({ name: 'password_reset_expires', type: 'timestamp', nullable: true })
    passwordResetExpires: Date;

    @Exclude()
    @Column({ name: 'temp_password', length: 255, nullable: true })
    tempPassword: string;

    @Column({ name: 'must_change_password', default: false })
    mustChangePassword: boolean;

    @Column({ name: 'password_changed_by', type: 'int', nullable: true })
    passwordChangedBy: number;

    @Column({ name: 'password_changed_at', type: 'timestamp', nullable: true })
    passwordChangedAt: Date;

    @Column({ name: 'last_login', type: 'timestamp', nullable: true })
    lastLogin: Date;

    @Exclude()
    @Column({ name: 'refresh_token_hash', length: 255, nullable: true })
    refreshTokenHash: string;

    @Column({ name: 'refresh_token_expires', type: 'timestamp', nullable: true })
    refreshTokenExpires: Date;

    @Column({ name: 'is_staff', default: false })
    isStaff: boolean;

    @Column({ name: 'is_superuser', default: false })
    isSuperuser: boolean;

    @Column({ name: 'created_at', type: 'timestamp', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ name: 'created_by', type: 'int', nullable: true })
    createdBy: number;

    @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
    updatedAt: Date;

    @Column({ name: 'updated_by', type: 'int', nullable: true })
    updatedBy: number;
}
