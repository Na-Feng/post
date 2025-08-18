import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DownloaderConsumer } from './downloader.consumer';
import { NotificationsModule } from '../5-notifications/notifications.module';
import { TasksModule } from '../7-tasks/tasks.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000, // 10 seconds
      maxRedirects: 5,
    }),
    NotificationsModule,
    TasksModule,
  ],
  providers: [DownloaderConsumer],
})
export class DownloaderModule {}
