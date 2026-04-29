import { 
  Controller, Post, UseGuards, UseInterceptors, UploadedFiles, Param, Request
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { FilesService } from './documents.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('applications')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post(':applicationId/documents')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'diploma', maxCount: 10 },
      { name: 'transcript', maxCount: 10 },
      { name: 'yds', maxCount: 10 },
      { name: 'attachments', maxCount: 20 },
    ])
  )
  async uploadDocuments(
    @Param('applicationId') applicationId: string,
    @UploadedFiles() files: {
      diploma?: Express.Multer.File[];
      transcript?: Express.Multer.File[];
      yds?: Express.Multer.File[];
      attachments?: Express.Multer.File[];
    },
    @Request() req,
  ) {
    return this.filesService.saveApplicationDocuments({
      applicationId: Number(applicationId),
      files,
      requester: req.user,
    });
  }
}