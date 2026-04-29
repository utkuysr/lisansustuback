import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from 'src/applications/entities/application.entity';
import { ApplicationDocument, ApplicationDocumentType } from './entities/application-document.entity';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(ApplicationDocument)
    private readonly documentRepo: Repository<ApplicationDocument>,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
  ) {}

  private toUrl(file: Express.Multer.File) {
    // ServeStaticModule serves Uploads under /documents
    return `/documents/${file.filename}`;
  }

  async saveApplicationDocuments(params: {
    applicationId: number;
    files: {
      diploma?: Express.Multer.File[];
      transcript?: Express.Multer.File[];
      yds?: Express.Multer.File[];
      attachments?: Express.Multer.File[];
    };
    requester: { sub: number; role?: string };
  }) {
    const { applicationId, files, requester } = params;

    const application = await this.applicationRepo.findOne({
      where: { id: applicationId },
      relations: ['user'],
    });
    if (!application) throw new NotFoundException('Başvuru bulunamadı.');

    const isAdmin = requester.role === 'admin';
    if (!isAdmin && application.user?.id !== requester.sub) {
      throw new ForbiddenException('Bu başvuruya dosya yükleyemezsiniz.');
    }

    const docs: ApplicationDocument[] = [];
    const pushFiles = (type: ApplicationDocumentType, list?: Express.Multer.File[]) => {
      for (const f of list ?? []) {
        const d = this.documentRepo.create({
          application,
          type,
          url: this.toUrl(f),
          storagePath: f.path,
          originalName: f.originalname,
          mimeType: f.mimetype,
          size: f.size,
        });
        docs.push(d);
      }
    };

    pushFiles(ApplicationDocumentType.DIPLOMA, files.diploma);
    pushFiles(ApplicationDocumentType.TRANSCRIPT, files.transcript);
    pushFiles(ApplicationDocumentType.YDS, files.yds);
    pushFiles(ApplicationDocumentType.ATTACHMENT, files.attachments);

    if (docs.length === 0) {
      throw new BadRequestException('Yüklenecek dosya bulunamadı.');
    }

    const saved = await this.documentRepo.save(docs);
    return {
      status: 'success',
      message: 'Dosyalar kaydedildi.',
      documents: saved.map((d) => ({ id: d.id, type: d.type, url: d.url })),
    };
  }
}