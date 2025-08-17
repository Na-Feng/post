import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

@Global() // 将此模块标记为全局
@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'douyin-check-queue' },
      { name: 'video-download-queue' },
      { name: 'video-upload-queue' },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}