import { Controller, Delete, Get, Param, Patch, Request, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  findAll(@Request() req) {
    return this.service.findByUser(req.user.sub);
  }

  @Get('unread-count')
  countUnread(@Request() req) {
    return this.service.countUnread(req.user.sub);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @Request() req) {
    return this.service.markRead(+id, req.user.sub);
  }

  @Patch('read-all')
  markAllRead(@Request() req) {
    return this.service.markAllRead(req.user.sub);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req) {
    return this.service.delete(+id, req.user.sub);
  }
}
