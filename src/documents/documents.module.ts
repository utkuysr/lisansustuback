import { BadRequestException, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FilesController } from './documents.controller';
import { FilesService } from './documents.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationDocument } from './entities/application-document.entity';
import { Application } from 'src/applications/entities/application.entity';

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

@Module({
  imports: [
    TypeOrmModule.forFeature([ApplicationDocument, Application]),
    MulterModule.register({
      storage: diskStorage({
        destination: './src/documents/Uploads',
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          return cb(new BadRequestException(`Geçersiz dosya türü: ${file.mimetype}. İzin verilenler: PDF, JPEG, PNG`), false);
        }
        cb(null, true);
      },
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
})
export class DocumentsModule {}