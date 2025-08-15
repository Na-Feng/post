import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

interface VideoDownloadJobData {
  aweme_id: string;
  sec_user_id: string;
  video_url: string;
  title: string;
  digg_count: string;
}

@Processor('video-download-queue')
export class VideoDownloaderConsumer extends WorkerHost {
  private readonly logger = new Logger(VideoDownloaderConsumer.name);

  constructor() {
    super();
  }

  async process(job: Job<VideoDownloadJobData>) {
    const { aweme_id, sec_user_id, video_url, title, digg_count } = job.data;
    this.logger.log(
      `Processing video download job ${job.id} for ${aweme_id} (User: ${sec_user_id} Title：${title})`,
    );

    try {
      // Create user-specific download directory if it doesn't exist
      const userDownloadDir = path.join(
        process.cwd(),
        'downloads',
        `douyin_user_${sec_user_id}`,
      );
      if (!fs.existsSync(userDownloadDir)) {
        fs.mkdirSync(userDownloadDir, { recursive: true });
      }

      const shoetTitle = title.split('\n')[0].trim();

      const fileName = `${aweme_id}#${shoetTitle}#${digg_count}.mp4`; // Assuming MP4 format
      const filePath = path.join(userDownloadDir, fileName);
      if (fs.existsSync(filePath)) {
        this.logger.log(`File exist ${aweme_id} to ${filePath}`);
        return Promise.reject(new Error('File already exists'));
      }
      const response = await axios({
        method: 'get',
        url: video_url,
        responseType: 'stream',
        headers: {
          'User-Agent': 'Mozilla/5.0',
          Referer: `https://www.douyin.com/user/${sec_user_id}`,
        },
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          this.logger.log(`Successfully downloaded ${aweme_id} to ${filePath}`);
          resolve(true);
        });
        writer.on('error', (err) => {
          this.logger.error(`Failed to download ${aweme_id}: ${err.message}`);
          reject(err);
        });
      });
    } catch (error) {
      this.logger.error(
        `Error in video download for ${aweme_id}: ${error.message}`,
      );
      throw error; // Re-throw to indicate job failure to BullMQ
    }
  }
}
