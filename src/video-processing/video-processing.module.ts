import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';

// 导入重构后的所有子模块
import { ScheduleModule } from './1-schedule/schedule.module';
import { CheckerModule } from './2-checker/checker.module';
import { DownloaderModule } from './3-downloader/downloader.module';
import { UploaderModule } from './4-uploader/uploader.module';
import { NotificationsModule } from './5-notifications/notifications.module';
import { RedisModule } from './6-common/redis/redis.module';
import { QueueModule } from './6-common/queues/queue.module';
import { TasksModule } from './7-tasks/tasks.module';

/**
 * @class VideoProcessingModule
 * @description 视频处理功能的根模块
 *
 * 核心职责：
 * 1. 导入所有与视频处理相关的子模块，将它们聚合在一起。
 * 2. 导入并配置全局性的模块，如 HttpModule 和 NestJS 的 ScheduleModule。
 */
@Module({
  imports: [
    // --- 全局性或基础设施模块 ---
    HttpModule, // 提供 HTTP 请求能力，供 DouyinService 使用
    NestScheduleModule.forRoot(), // 启用 @Cron 定时任务调度

    // --- 公共模块 ---
    RedisModule, // 提供 Redis 服务
    QueueModule, // 提供所有 BullMQ 队列的注册和配置

    // --- 功能模块 ---
    ScheduleModule, // 1. 任务调度模块
    CheckerModule, // 2. 视频检查模块
    DownloaderModule, // 3. 视频下载模块
    UploaderModule, // 4. 视频上传模块
    NotificationsModule, // 5. 实时通知模块
    TasksModule, // 7. 任务管理模块
  ],
  // 这个根模块通常不需要再单独提供 providers 或 exports
  // 因为所有具体的实现都封装在各自的子模块中了
  providers: [],
  exports: [],
})
export class VideoProcessingModule {}
