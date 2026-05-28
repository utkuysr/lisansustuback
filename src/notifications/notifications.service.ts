import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  async create(params: {
    userId: number;
    type: NotificationType | string;
    title: string;
    message: string;
    metadata?: Record<string, any>;
  }): Promise<Notification> {
    return this.repo.save(this.repo.create(params));
  }

  async findByUser(userId: number): Promise<Notification[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async countUnread(userId: number): Promise<{ count: number }> {
    const count = await this.repo.count({ where: { userId, isRead: false } });
    return { count };
  }

  async markRead(id: number, userId: number): Promise<{ message: string }> {
    await this.repo.update({ id, userId }, { isRead: true, readAt: new Date() });
    return { message: 'Bildirim okundu olarak işaretlendi.' };
  }

  async markAllRead(userId: number): Promise<{ message: string }> {
    await this.repo.update({ userId, isRead: false }, { isRead: true, readAt: new Date() });
    return { message: 'Tüm bildirimler okundu olarak işaretlendi.' };
  }

  async delete(id: number, userId: number): Promise<{ message: string }> {
    await this.repo.softDelete({ id, userId });
    return { message: 'Bildirim silindi.' };
  }
}
