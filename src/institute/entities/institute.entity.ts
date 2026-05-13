import { User } from 'src/users/entities/user.entity';
import { University } from 'src/universities/entities/university.entity';
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'institutes', schema: 'belek_graduate_admission' })
export class Institute {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 255 })
    name: string;

    @ManyToOne(() => University, { nullable: true, eager: true })
    @JoinColumn({ name: 'university_id' })
    university?: University;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'createdby' })
    createdBy?: User;

    @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
    updatedAt?: Date;

    @Column({ name: 'updated_by', type: 'int', nullable: true })
    updatedBy?: number;

    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    deletedAt?: Date;
}
