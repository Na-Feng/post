import { Module } from '@nestjs/common';
import { DownloaderConsumer } from './downloader.consumer';
import { NotificationsModule } from '../5-notifications/notifications.module';
import { TasksModule } from '../7-tasks/tasks.module';

@Module({
  imports: [NotificationsModule, TasksModule], // 导入通知模块和任务模块
  providers: [DownloaderConsumer],
})
export class DownloaderModule {}