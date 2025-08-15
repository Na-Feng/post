import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Logger, OnModuleInit } from '@nestjs/common';
import { UserAccount } from './dto/user-account.dto';
import { DouyinService } from './douyin.service';
import { YoutubeService } from './youtube.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import { VideoProgressGateway } from './video-progress.gateway';
import { InjectQueue } from '@nestjs/bullmq';
import Redis from 'ioredis';
import { DouyinVideo } from './dto/douyin-video.dto';
import axios from 'axios';

// Helper function to simulate progress
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

@Processor('video', { concurrency: 50 }) // Reduced concurrency for stability with progress tracking
export class VideoProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(VideoProcessor.name);
  private redis: any;

  constructor(
    private readonly douyinService: DouyinService,
    private readonly youtubeService: YoutubeService,
    private readonly progressGateway: VideoProgressGateway,
    @InjectQueue('video') private readonly videoQueue: Queue,
  ) {
    super();
  }

  async onModuleInit() {
    this.redis = await this.videoQueue.client;
  }

  async process(job: Job<UserAccount>): Promise<void> {
    if (job.name !== 'process-video') {
      return;
    }

    const userAccount = job.data;
    const jobId = String(job.id);
    const taskKey = `task:${jobId}`;
    this.logger.log(
      `Starting video processing for Douyin user: ${userAccount.douyinId} (Job ID: ${jobId})`,
    );

    try {
      await this.redis.hset(taskKey, {
        id: jobId,
        douyinId: userAccount.douyinId,
        status: 'processing',
        progress: 0,
      });
      this.progressGateway.sendTaskStatusUpdate(jobId, 'processing', {
        douyinId: userAccount.douyinId,
      });

      const douyinVideo: DouyinVideo = await this.douyinService.getLatestVideo(
        userAccount.douyinId,
      );

      // Use actual metadata from douyinVideo for file naming
      const videoFileName = `${douyinVideo.title}#${douyinVideo.author}#${douyinVideo.likes}.mp4`;
      const userDownloadsDir = path.join('downloads', userAccount.douyinId);
      const todayDateDir = path.join(
        userDownloadsDir,
        new Date().toISOString().slice(0, 10),
      ); // YYYY-MM-DD
      const localPath = path.join(todayDateDir, videoFileName);

      try {
        await fs.access(localPath); // Check if file exists
        this.logger.log(
          `Video ${videoFileName} already exists at ${localPath}. Skipping.`,
        );
        await this.redis.hset(taskKey, { status: 'skipped', progress: 100 });
        this.progressGateway.sendTaskStatusUpdate(jobId, 'skipped');
        await this.redis.del(taskKey);
        return;
      } catch (error) {
        if (error.code !== 'ENOENT') {
          // If error is not "file not found", rethrow
          throw error;
        }
        // File does not exist, proceed with download
      }

      await fs.mkdir(todayDateDir, { recursive: true });

      // Simulate download with progress updates
      for (let progress = 0; progress <= 100; progress += 10) {
        await this.redis.hset(taskKey, 'progress', progress);
        this.progressGateway.sendProgressUpdate(jobId, progress, {});
        this.logger.debug(`Job ${jobId}: Download progress ${progress}%`);
        await sleep(50); // Simulate network latency
      }

      await fs.writeFile(
        localPath,
        `Simulated video content from ${douyinVideo.url}`,
      );
      this.logger.debug(`Download complete: ${localPath}`);

      await this.youtubeService.uploadVideo(userAccount, localPath);

      await this.redis.hset(taskKey, { status: 'completed', progress: 100 });
      this.progressGateway.sendTaskStatusUpdate(jobId, 'completed');
      await this.redis.del(taskKey);

      await fs.unlink(localPath);
      this.logger.debug(`Cleaned up temporary file: ${localPath}`);
    } catch (error) {
      this.logger.error(
        `Job ${jobId} failed for user ${userAccount.douyinId}`,
        error.stack,
      );
      await this.redis.hset(taskKey, {
        status: 'failed',
        error: error.message,
      });
      this.progressGateway.sendTaskStatusUpdate(jobId, 'failed', {
        error: error.message,
      });
      await this.redis.del(taskKey); // Delete failed job record
      throw error;
    }
  }
}
