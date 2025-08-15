import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { DouyinCheckerService } from './douyin-checker.service';
import { DouyinCheckerConsumer } from './douyin-checker.consumer';
import { RedisService } from './redis.service';
import { VideoDownloaderConsumer } from './video-downloader.consumer';

@Module({
  imports: [
    HttpModule,
    BullModule.registerQueue({
      name: 'douyin-check-queue', // 定义抖音检查队列的名称
    }),
    BullModule.registerQueue({
      name: 'video-download-queue', // 定义视频下载队列的名称
    }),
  ],
  providers: [DouyinCheckerService, DouyinCheckerConsumer, RedisService, VideoDownloaderConsumer],
  exports: [
    DouyinCheckerService,
    DouyinCheckerConsumer,
    RedisService,
    VideoDownloaderConsumer,
    BullModule.registerQueue({
      name: 'douyin-check-queue',
    }),
  ], // 如果其他模块需要使用此服务，则导出
})
export class VideoProcessingModule {}