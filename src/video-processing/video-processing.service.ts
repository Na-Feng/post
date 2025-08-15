import { Injectable, Logger } from '@nestjs/common';

import { InjectQueue } from '@nestjs/bullmq';

import { Queue } from 'bullmq';

import { Cron } from '@nestjs/schedule';

import { UserAccount } from './dto/user-account.dto';

@Injectable()
export class VideoProcessingService {
  private readonly logger = new Logger(VideoProcessingService.name);

  constructor(@InjectQueue('video') private videoQueue: Queue) {}

  @Cron('*/30 20 * * * *')
  async scheduleVideoProcessing() {
    this.logger.debug('Adding 200 user accounts to the video queue...');

    for (let i = 1; i <= 1; i++) {
      const userAccount: UserAccount = {
        id: i,

        nickName: `电影迷小雅`,

        douyinId: `MS4wLjABAAAAI6TaZ1DuCqzZc8Meu7BKyk4O-d8Q9WIUCP_rdbIsuC8EJKfgyv5KG9KS1qypAdrD`,

        googleAccount: `user${i}@gmail.com`,

        youtubeApiKey: `youtube_api_key_${i}`,
      };

      await this.videoQueue.add('process-video', userAccount, {
        attempts: 3,

        backoff: {
          type: 'exponential',

          delay: 1000,
        },
      });
    }

    this.logger.debug('Finished adding jobs to the queue.');
  }
}
