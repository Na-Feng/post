import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { UploadTaskDto } from '../6-common/dto/task.dto';
import { UserAccountDto } from '../6-common/dto/user.dto';
import { TasksService } from '../7-tasks/tasks.service';
import { YoutubeService } from './youtube.service';

// 定义上传队列的组合任务数据结构
interface UploadJobData extends UploadTaskDto {
  user: UserAccountDto;
  originalTaskId: string | number;
}

@Processor('video-upload-queue')
export class YoutubeConsumer extends WorkerHost {
  private readonly logger = new Logger(YoutubeConsumer.name);

  constructor(
    private readonly tasksService: TasksService,
    private readonly youtubeService: YoutubeService,
  ) {
    super();
  }

  async process(job: Job<UploadJobData>): Promise<string> {
    const { filePath, title, description, user, originalTaskId } = job.data;
    const taskId = originalTaskId.toString();

    this.logger.log(
      `开始处理YouTube上传任务 ${job.id} (原始任务ID: ${taskId})，用户: ${user.nickName}`,
    );

    await this.tasksService.updateTaskStatus(
      taskId,
      'uploading',
      '开始上传到YouTube',
    );

    try {
      const videoMetadata = { title, description };
      const youtubeUrl = await this.youtubeService.uploadVideo(
        filePath,
        videoMetadata,
        user,
      );

      this.logger.log(`[${taskId}] 视频成功上传到YouTube！URL: ${youtubeUrl}`);

      await this.tasksService.updateTaskStatus(
        taskId,
        'completed',
        `上传成功: ${youtubeUrl}`,
        youtubeUrl,
      );

      // fs.unlinkSync(filePath);
      // this.logger.log(`[${taskId}] 已删除本地临时文件: ${filePath}`);

      return youtubeUrl;
    } catch (error) {
      const errorMessage =
        error.response?.data?.error?.message || error.message;
      this.logger.error(
        `[${taskId}] 上传文件 ${filePath} 到YouTube失败: ${errorMessage}`,
      );
      await this.tasksService.updateTaskStatus(
        taskId,
        'upload_failed',
        `上传失败: ${errorMessage}`,
      );
      throw error;
    }
  }
}
