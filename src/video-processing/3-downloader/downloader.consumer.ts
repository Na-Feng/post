import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Logger } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { DownloadTaskDto } from '../6-common/dto/task.dto';
import { NotificationsGateway } from '../5-notifications/notifications.gateway';
import { TasksService } from '../7-tasks/tasks.service';
import { UserAccountDto } from '../6-common/dto/user.dto';

// 定义下载队列的任务数据结构
interface DownloadJobData {
  user: UserAccountDto;
  video: DownloadTaskDto;
}

@Processor('video-download-queue')
export class DownloaderConsumer extends WorkerHost {
  private readonly logger = new Logger(DownloaderConsumer.name);

  constructor(
    @InjectQueue('video-upload-queue') private videoUploadQueue: Queue,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly tasksService: TasksService,
  ) {
    super();
  }

  async process(job: Job<DownloadJobData>) {
    if (!job.id) {
      this.logger.error('Job has no ID, skipping processing.', job.data);
      return;
    }

    const { user, video } = job.data;
    const { aweme_id, sec_user_id, video_url, title, digg_count } = video;
    const taskId = job.id.toString();

    this.logger.log(
      `开始处理视频下载任务 ${taskId}，视频ID: ${aweme_id}，用户: ${user.nickName}`,
    );

    try {
      const userDownloadDir = path.join(
        process.cwd(),
        'downloads',
        `douyin_user_${sec_user_id}`,
      );
      if (!fs.existsSync(userDownloadDir)) {
        fs.mkdirSync(userDownloadDir, { recursive: true });
      }

      const safeTitle = title
        .replace(/[\r\n\s\\/:'"*?<>|]+/g, '_')
        .substring(0, 50);
      const fileName = `${aweme_id}#${safeTitle}#${digg_count}.mp4`;
      const filePath = path.join(userDownloadDir, fileName);

      if (fs.existsSync(filePath)) {
        this.logger.warn(`文件已存在，跳过下载: ${filePath}`);
        // await this.tasksService.updateTaskStatus(
        //   taskId,
        //   'downloaded',
        //   '文件已存在，直接进入上传流程',
        // );
        // await this.createUploadTask(filePath, title, taskId, user);
        return;
      }

      await this.tasksService.createTask({ id: job.id, data: video });
      this.notificationsGateway.sendToAll('task-update', {
        taskId,
        status: 'downloading',
        message: `开始下载: ${title}`,
        aweme_id,
      });

      const response = await axios({
        method: 'get',
        url: video_url,
        responseType: 'stream',
        headers: {
          'User-Agent': 'Mozilla/5.0',
          Referer: `https://www.douyin.com/user/${sec_user_id}`,
        },
      });

      const totalLength = parseInt(response.headers['content-length'], 10);
      let receivedLength = 0;
      let lastNotifiedProgress = -1;

      const writer = fs.createWriteStream(filePath);
      response.data.on('data', (chunk) => {
        receivedLength += chunk.length;
        if (totalLength) {
          const progress = Math.round((receivedLength * 100) / totalLength);
          if (progress > lastNotifiedProgress) {
            void this.tasksService.updateTaskProgress(taskId, progress);
            this.notificationsGateway.sendToAll('download-progress', {
              taskId,
              progress,
            });
            lastNotifiedProgress = progress;
          }
        }
      });

      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          void (async () => {
            this.logger.log(`成功下载视频 ${aweme_id} 到: ${filePath}`);
            const message = '下载完成，准备上传';
            await this.tasksService.updateTaskStatus(
              taskId,
              'downloaded',
              message,
            );
            this.notificationsGateway.sendToAll('task-update', {
              taskId,
              status: 'downloaded',
              message,
            });
            await this.createUploadTask(filePath, title, taskId, user);
            resolve(true);
          })();
        });
        writer.on('error', (err) => {
          this.logger.error(`下载视频 ${aweme_id} 失败: ${err.message}`);
          const message = `下载失败: ${err.message}`;
          void this.tasksService.updateTaskStatus(
            taskId,
            'download_failed',
            message,
          );
          this.notificationsGateway.sendToAll('task-update', {
            taskId,
            status: 'download_failed',
            message,
          });
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          reject(err);
        });
      });
    } catch (error) {
      this.logger.error(
        `处理视频下载任务 ${aweme_id} 时发生错误: ${error.message}`,
      );
      const message = `下载任务处理失败: ${error.message}`;
      await this.tasksService.updateTaskStatus(
        taskId,
        'download_failed',
        message,
      );
      this.notificationsGateway.sendToAll('task-update', {
        taskId,
        status: 'download_failed',
        message,
      });
      throw error;
    }
  }

  private async createUploadTask(
    filePath: string,
    title: string,
    originalTaskId: string | number,
    user: UserAccountDto, // 接收完整的用户信息
  ) {
    const description = `#抖音 #视频搬运\n\n原始标题: ${title}`;
    await this.videoUploadQueue.add('upload-to-youtube', {
      filePath,
      title,
      description,
      originalTaskId,
      user, // 传递用户信息
    });
    this.logger.log(
      `已为文件 ${filePath} 创建上传任务，关联用户: ${user.nickName}`,
    );
  }
}
