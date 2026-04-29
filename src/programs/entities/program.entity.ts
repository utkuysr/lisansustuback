import { Faculty } from "src/faculties/entities/faculty.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'programs', schema: 'belek_graduate_admission' })
export class Program {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 255 })
    name: string;

    @Column()
    Quota: number;

    @Column()
    Description: string;

    @Column()
    ApplicationStartdate: Date;

    @Column()
    ApplicationEnddate: Date;

    @Column()
    EvaluationDate: Date;

    @ManyToOne(() => Faculty, { eager: true, nullable: true })
    @JoinColumn({ name: 'faculty_id' })
    faculty: Faculty;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'createdBy' })
    createdBy: User;

    @Column({ name: 'created_at', type: 'timestamp', nullable: true })
    createdAt?: Date;

    @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
    updatedAt?: Date;

    @Column({ name: 'updated_by', type: 'int', nullable: true })
    updatedBy?: number;
}
