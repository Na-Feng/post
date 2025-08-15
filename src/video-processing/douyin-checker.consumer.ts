import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { DouyinCheckerService } from './douyin-checker.service';
import { InjectQueue } from '@nestjs/bullmq'; // Import InjectQueue
import { Queue } from 'bullmq'; // Import Queue

@Processor('douyin-check-queue') // 对应 video-processing.module.ts 中定义的队列名称
export class DouyinCheckerConsumer extends WorkerHost {
  private readonly logger = new Logger(DouyinCheckerConsumer.name);

  constructor(
    private readonly douyinCheckerService: DouyinCheckerService,
    @InjectQueue('video-download-queue') private videoDownloadQueue: Queue, // Inject download queue
  ) {
    super();
  }

  async process(job: Job<{ secUserId: string }>) {
    this.logger.log(
      `Processing Douyin check job ${job.id} for user: ${job.data.secUserId}`,
    );
    try {
      const newVideo = await this.douyinCheckerService.checkDouyinUserVideos(
        job.data.secUserId,
      );

      if (newVideo) {
        this.logger.log(
          `New video detected for ${newVideo.sec_user_id}: ${newVideo.title} (aweme_id: ${newVideo.aweme_id})`,
        );
        // Push job to download queue
        await this.videoDownloadQueue.add(
          'download-video',
          {
            aweme_id: newVideo.aweme_id,
            sec_user_id: newVideo.sec_user_id,
            video_url: newVideo.video_url,
            title: newVideo.title,
            digg_count: newVideo.digg_count
          },
          {
            priority: 1, // Example priority, adjust as needed
            removeOnComplete: true,
            removeOnFail: false,
          },
        );
        this.logger.log(`Added download job for ${newVideo.aweme_id} to queue.`);
      } else {
        this.logger.log(`No new videos found for ${job.data.secUserId}.`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to process job ${job.id} for user ${job.data.secUserId}: ${error.message}`,
      );
      // 抛出错误，BullMQ 会根据配置进行重试
      throw error;
    }
  }
}