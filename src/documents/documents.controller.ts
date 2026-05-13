import {
  Controller, Post, Delete, Get, UseGuards, UseInterceptors,
  UploadedFiles, Param, ParseIntPipe, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { FilesService } from './documents.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiTags('documents')
@ApiBearerAuth()
@Controller('applications')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get(':applicationId/documents')
  @ApiOperation({ summary: 'Başvuruya ait belgeleri listele' })
  async listDocuments(@Param('applicationId', ParseIntPipe) applicationId: number, @Request() req) {
    return this.filesService.findByApplication(applicationId, req.user);
  }

  @Post(':applicationId/documents')
  @ApiOperation({ summary: 'Başvuruya belge yükle' })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'diploma', maxCount: 1 },
      { name: 'transcript', maxCount: 1 },
      { name: 'yds', maxCount: 2 },
      { name: 'ales_certificate', maxCount: 1 },
      { name: 'reference_letter', maxCount: 3 },
      { name: 'national_id', maxCount: 1 },
      { name: 'attachments', maxCount: 10 },
    ]),
  )
  async uploadDocuments(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @UploadedFiles() files: {
      diploma?: Express.Multer.File[];
      transcript?: Express.Multer.File[];
      yds?: Express.Multer.File[];
      ales_certificate?: Express.Multer.File[];
      reference_letter?: Express.Multer.File[];
      national_id?: Express.Multer.File[];
      attachments?: Express.Multer.File[];
    },
    @Request() req,
  ) {
    return this.filesService.saveApplicationDocuments({ applicationId, files, requester: req.user });
  }

  @Delete('documents/:documentId')
  @ApiOperation({ summary: 'Belge sil' })
  async deleteDocument(@Param('documentId', ParseIntPipe) documentId: number, @Request() req) {
    return this.filesService.deleteDocument(documentId, req.user);
  }
}
