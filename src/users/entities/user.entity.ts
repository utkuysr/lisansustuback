import { Column, DeleteDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Role } from 'src/roles/entities/role.entity';

@Entity({ name: 'users', schema: 'public' })
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 150, nullable: true })
    username: string;

    @Column({ length: 254, unique: true })
    email: string;

    @Exclude()
    @Column({ name: 'password_hash', length: 255 })
    passwordHash: string;

    @Column({ name: 'first_name', length: 100 })
    firstName: string;

    @Column({ name: 'last_name', length: 100 })
    lastName: string;

    @Column({ name: 'user_type', length: 30, default: 'student' })
    userType: string;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'created_by', nullable: true })
    createdBy: number;

    @Column({ name: 'updated_by', nullable: true })
    updatedBy: number;

    @Column({ name: 'create_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createDate: Date;

    @Column({ name: 'update_date', type: 'timestamp', nullable: true })
    updateDate: Date;

    @Column({ name: 'profile_image_url', length: 500, nullable: true })
    profileImageUrl: string;

    @Column({ length: 20, nullable: true })
    phone: string;

    @Column({ name: 'is_email_verified', default: false })
    isEmailVerified: boolean;

    @Column({ name: 'email_verified_at', type: 'timestamp', nullable: true })
    emailVerifiedAt: Date;

    @Column({ name: 'language_code', length: 5, nullable: true })
    languageCode: string;

    @Column({ length: 255, nullable: true })
    faculty: string;

    @Column({ length: 255, nullable: true })
    department: string;

    @ManyToOne(() => Role, (role) => role.users, { nullable: false, eager: true })
    @JoinColumn({ name: 'role', referencedColumnName: 'name' })
    role: Role;

    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    deletedAt?: Date;
}
