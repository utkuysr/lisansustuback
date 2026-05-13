import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Application } from 'src/applications/entities/application.entity';

export enum ApplicationDocumentType {
  DIPLOMA = 'DIPLOMA',
  TRANSCRIPT = 'TRANSCRIPT',
  YDS = 'YDS',
  ALES_CERTIFICATE = 'ALES_CERTIFICATE',
  REFERENCE_LETTER = 'REFERENCE_LETTER',
  NATIONAL_ID = 'NATIONAL_ID',
  ATTACHMENT = 'ATTACHMENT',
}

@Entity({ name: 'application_documents', schema: 'belek_graduate_admission' })
export class ApplicationDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @ManyToOne(() => Application, (a) => a.documents, { onDelete: 'CASCADE', eager: false })
  application: Application;

  @Column({ type: 'enum', enum: ApplicationDocumentType })
  type: ApplicationDocumentType;

  // Public URL served by ServeStaticModule (e.g. /documents/transcript-123.pdf)
  @Column({ length: 500 })
  url: string;

  // Server-side storage path (e.g. src/documents/Uploads/...)
  @Column({ name: 'storage_path', length: 800 })
  storagePath: string;

  @Column({ name: 'original_name', length: 500, nullable: true })
  originalName?: string;

  @Column({ name: 'mime_type', length: 120, nullable: true })
  mimeType?: string;

  @Column({ type: 'int', nullable: true })
  size?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

