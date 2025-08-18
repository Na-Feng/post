import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../6-common/redis/redis.service';
import { DownloadTaskDto } from '../6-common/dto/task.dto';
import { redisKeys } from '../6-common/redis/redis.keys';

// 定义存储在 Redis 中的任务详情的数据结构
export interface TaskDetails {
  taskId: string;
  aweme_id: string;
  sec_user_id: string;
  title: string;
  status:
    | 'downloading'
    | 'download_failed'
    | 'downloaded'
    | 'uploading'
    | 'upload_failed'
    | 'completed';
  progress: number;
  message: string;
  createdAt: string; // ISO 8601 format
  youtubeUrl?: string; // 上传成功后的YouTube链接
}

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  private readonly MAX_TASKS_PER_USER = 100;

  constructor(private readonly redisService: RedisService) {}

  // --- 任务管理方法 ---

  /**
   * @description 创建一个新的任务记录并将其添加到用户的任务列表中
   */
  async createTask(job: {
    id: string | number;
    data: DownloadTaskDto;
  }): Promise<void> {
    if (!job.id) {
      this.logger.error('没有任务ID,跳过', job.data);
      return;
    }
    const { id: taskId, data } = job;
    const { sec_user_id, aweme_id, title } = data;
    const userTasksKey = redisKeys.userTasksList(sec_user_id);
    const taskKey = redisKeys.taskHash(taskId);

    const taskDetails: TaskDetails = {
      taskId: taskId.toString(),
      aweme_id,
      sec_user_id,
      title,
      status: 'downloading',
      progress: 0,
      message: '下载已开始...',
      createdAt: new Date().toISOString(),
    };

    try {
      const pipeline = this.redisService.client.pipeline();
      pipeline.hmset(taskKey, taskDetails);
      pipeline.lpush(userTasksKey, taskId.toString());
      pipeline.ltrim(userTasksKey, 0, this.MAX_TASKS_PER_USER - 1);
      await pipeline.exec();
      this.logger.log(`已为用户 ${sec_user_id} 创建任务记录: ${taskId}`);
    } catch (error) {
      this.logger.error(`创建任务记录失败: ${taskId}`, error);
    }
  }

  async updateTaskProgress(taskId: string, progress: number): Promise<void> {
    const taskKey = redisKeys.taskHash(taskId);
    await this.redisService.client.hset(taskKey, 'progress', progress);
  }

  async updateTaskStatus(
    taskId: string,
    status: TaskDetails['status'],
    message: string,
    youtubeUrl?: string,
  ): Promise<void> {
    const taskKey = redisKeys.taskHash(taskId);
    const updateData: any = { status, message };
    if (youtubeUrl) {
      updateData.youtubeUrl = youtubeUrl;
    }
    await this.redisService.client.hset(taskKey, updateData);
  }

  async getTasksForUser(secUserId: string): Promise<TaskDetails[]> {
    const userTasksKey = redisKeys.userTasksList(secUserId);
    const taskIds = await this.redisService.client.lrange(userTasksKey, 0, -1);
    if (!taskIds || taskIds.length === 0) return [];

    const pipeline = this.redisService.client.pipeline();
    taskIds.forEach((id) => pipeline.hgetall(redisKeys.taskHash(id)));
    const results = await pipeline.exec();
    if (!results) return [];

    return results
      .map(([err, data]:[null,Record<string,string>]): TaskDetails| null => {
        if (err || !data) return null;
        return {
          ...data,
          progress: parseInt(data.progress, 10),
        } as TaskDetails;
      })
      .filter((task): task is TaskDetails => task !== null);
  }
}
