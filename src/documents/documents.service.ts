import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { Application } from 'src/applications/entities/application.entity';
import { ApplicationDocument, ApplicationDocumentType } from './entities/application-document.entity';

const MAX_PER_TYPE: Record<ApplicationDocumentType, number> = {
  [ApplicationDocumentType.DIPLOMA]: 1,
  [ApplicationDocumentType.TRANSCRIPT]: 1,
  [ApplicationDocumentType.YDS]: 2,
  [ApplicationDocumentType.ALES_CERTIFICATE]: 1,
  [ApplicationDocumentType.REFERENCE_LETTER]: 3,
  [ApplicationDocumentType.NATIONAL_ID]: 1,
  [ApplicationDocumentType.ATTACHMENT]: 10,
};

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(ApplicationDocument)
    private readonly documentRepo: Repository<ApplicationDocument>,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
  ) {}

  private toUrl(file: Express.Multer.File) {
    return `/documents/${file.filename}`;
  }

  async saveApplicationDocuments(params: {
    applicationId: number;
    files: {
      diploma?: Express.Multer.File[];
      transcript?: Express.Multer.File[];
      yds?: Express.Multer.File[];
      ales_certificate?: Express.Multer.File[];
      reference_letter?: Express.Multer.File[];
      national_id?: Express.Multer.File[];
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

    const existingDocs = await this.documentRepo.find({
      where: { application: { id: applicationId } } as any,
      select: ['id', 'type'],
    });

    const countByType = (type: ApplicationDocumentType) =>
      existingDocs.filter((d) => d.type === type).length;

    const docs: ApplicationDocument[] = [];

    const pushFiles = (type: ApplicationDocumentType, list?: Express.Multer.File[]) => {
      if (!list?.length) return;
      const existing = countByType(type);
      const max = MAX_PER_TYPE[type];
      if (existing + list.length > max) {
        throw new BadRequestException(`"${type}" türünde en fazla ${max} dosya yüklenebilir. Mevcut: ${existing}.`);
      }
      for (const f of list) {
        docs.push(this.documentRepo.create({
          application,
          type,
          url: this.toUrl(f),
          storagePath: f.path,
          originalName: f.originalname,
          mimeType: f.mimetype,
          size: f.size,
        }));
      }
    };

    pushFiles(ApplicationDocumentType.DIPLOMA, files.diploma);
    pushFiles(ApplicationDocumentType.TRANSCRIPT, files.transcript);
    pushFiles(ApplicationDocumentType.YDS, files.yds);
    pushFiles(ApplicationDocumentType.ALES_CERTIFICATE, files.ales_certificate);
    pushFiles(ApplicationDocumentType.REFERENCE_LETTER, files.reference_letter);
    pushFiles(ApplicationDocumentType.NATIONAL_ID, files.national_id);
    pushFiles(ApplicationDocumentType.ATTACHMENT, files.attachments);

    if (docs.length === 0) throw new BadRequestException('Yüklenecek dosya bulunamadı.');

    const saved = await this.documentRepo.save(docs);
    return {
      status: 'success',
      message: 'Dosyalar kaydedildi.',
      documents: saved.map((d) => ({ id: d.id, type: d.type, url: d.url })),
    };
  }

  async deleteDocument(documentId: number, requester: { sub: number; role?: string }): Promise<{ message: string }> {
    const doc = await this.documentRepo.findOne({
      where: { id: documentId },
      relations: ['application', 'application.user'],
    });
    if (!doc) throw new NotFoundException('Belge bulunamadı.');

    const isAdmin = requester.role === 'admin';
    if (!isAdmin && doc.application?.user?.id !== requester.sub) {
      throw new ForbiddenException('Bu belgeyi silemezsiniz.');
    }

    try {
      if (doc.storagePath && fs.existsSync(doc.storagePath)) {
        fs.unlinkSync(doc.storagePath);
      }
    } catch {
      // disk hatası başvuruyu engellemez
    }

    await this.documentRepo.remove(doc);
    return { message: 'Belge silindi.' };
  }

  async findByApplication(applicationId: number, requester: { sub: number; role?: string }): Promise<ApplicationDocument[]> {
    const application = await this.applicationRepo.findOne({
      where: { id: applicationId },
      relations: ['user'],
    });
    if (!application) throw new NotFoundException('Başvuru bulunamadı.');

    const isAdmin = requester.role === 'admin';
    if (!isAdmin && application.user?.id !== requester.sub) {
      throw new ForbiddenException('Bu başvurunun belgelerine erişim yetkiniz yok.');
    }

    return this.documentRepo.find({ where: { application: { id: applicationId } } as any });
  }
}
