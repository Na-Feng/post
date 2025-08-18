import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Logger } from '@nestjs/common';
import { DouyinService } from './douyin.service';
import { UserAccountDto } from '../6-common/dto/user.dto';
import { VideoDto } from '../6-common/dto/video.dto';

/**
 * @class DouyinConsumer
 * @description BullMQ 消费者：处理“抖音主页检查”任务
 *
 * 核心职责：
 * 1. 监听 "douyin-check-queue" 队列，任务数据为 UserAccountDto。
 * 2. 调用 DouyinService 对指定用户进行新视频检查。
 * 3. 若发现新视频，将包含视频信息和用户信息的新任务推送到 "video-download-queue"。
 */
@Processor('douyin-check-queue')
export class DouyinConsumer extends WorkerHost {
  private readonly logger = new Logger(DouyinConsumer.name);

  constructor(
    private readonly douyinService: DouyinService,
    @InjectQueue('video-download-queue') private videoDownloadQueue: Queue,
  ) {
    super();
  }

  /**
   * @description 处理单个检查任务的方法
   * @param job - 包含 UserAccountDto 的 Job 对象
   */
  async process(job: Job<UserAccountDto>) {
    const user = job.data;
    this.logger.log(
      `开始处理抖音检查任务 ${job.id}，用户: ${user.nickName} (${user.douyinSecId})`,
    );

    try {
      // 调用 service 来检查是否有新视频
      const newVideo: VideoDto | null = await this.douyinService.checkNewVideo(
        user.douyinSecId,
      );

      if (newVideo) {
        this.logger.log(
          `发现新视频，用户: ${user.nickName}, 标题: ${newVideo.title}`,
        );

        // 将“下载任务”添加到下载队列
        // 任务数据包含完整的用户信息和视频信息，确保信息链条不断裂
        await this.videoDownloadQueue.add(
          'download-video', // 任务名称
          {
            user: user, // 完整的用户信息
            video: newVideo, // 完整的视频信息
          },
          {
            priority: 1, // 优先级，可根据需要调整
            removeOnComplete: true,
            removeOnFail: false,
          },
        );
        this.logger.log(`已为视频 ${newVideo.aweme_id} 创建下载任务。`);
      } else {
        this.logger.log(`用户 ${user.nickName} 没有发现新视频。`);
      }
    } catch (error) {
      this.logger.error(
        `处理用户 ${user.nickName} 的检查任务 ${job.id} 失败: ${error.message}`,
      );
      throw error;
    }
  }
}
