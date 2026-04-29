import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "src/users/entities/user.entity";

@Entity({ name: 'roles', schema: 'belek_graduate_admission' })
export class Role {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 50, unique: true })
    name: string;

    @Column({ length: 255, nullable: true })
    description: string;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'created_by', type: 'int', nullable: true })
    createdBy?: number;

    @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
    updatedAt?: Date;

    @Column({ name: 'updated_by', type: 'int', nullable: true })
    updatedBy?: number;

    @OneToMany(() => User, (user) => user.role, { cascade: true })
    users: User[];
}
