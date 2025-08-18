import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { RedisService } from '../6-common/redis/redis.service';
import { DownloadTaskDto } from '../6-common/dto/task.dto';
import { redisKeys } from '../6-common/redis/redis.keys';
import {
  UserAccountDto,
  CreateUserAccountDto,
  UpdateUserAccountDto,
} from '../6-common/dto/user.dto';

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
      .map(([err, data]) => {
        if (err || !data) return null;
        return {
          ...data,
          progress: parseInt(data.progress, 10),
        } as TaskDetails;
      })
      .filter((task): task is TaskDetails => task !== null);
  }

  // --- 用户账户管理方法 ---

  /**
   * @description 添加一个新的被监控用户到 Redis
   * @param createUserDto - 创建用户所需的数据
   * @returns The newly created user account.
   * @throws {ConflictException} If the user already exists.
   */
  async addUser(createUserDto: CreateUserAccountDto): Promise<UserAccountDto> {
    const { douyinSecId } = createUserDto;
    const userKey = redisKeys.userHash(douyinSecId);

    const exists = await this.redisService.client.exists(userKey);
    if (exists) {
      throw new ConflictException(`用户 ${douyinSecId} 已存在。`);
    }

    const newUser: UserAccountDto = {
      id: Date.now(), // 使用时间戳作为简单ID
      ...createUserDto,
    };

    const pipeline = this.redisService.client.pipeline();
    pipeline.sadd(redisKeys.monitoringUsersSet(), douyinSecId);
    pipeline.hset(userKey, newUser);
    await pipeline.exec();

    this.logger.log(`已添加新用户: ${newUser.nickName} (${douyinSecId})`);
    return newUser;
  }

  /**
   * @description 获取所有被监控用户的列表
   * @returns A list of all user accounts.
   */
  async getAllUsers(): Promise<UserAccountDto[]> {
    const userIds = await this.redisService.client.smembers(
      redisKeys.monitoringUsersSet(),
    );
    if (!userIds || userIds.length === 0) {
      return [];
    }

    const pipeline = this.redisService.client.pipeline();
    userIds.forEach((id) => pipeline.hgetall(redisKeys.userHash(id)));
    const results = await pipeline.exec();

    return results
      .map(([err, data]) => {
        if (err || !data) return null;
        return { ...data, id: parseInt(data.id, 10) } as UserAccountDto;
      })
      .filter((user): user is UserAccountDto => user !== null);
  }

  /**
   * @description 获取指定用户的详细信息
   * @param secUserId - The user's douyinSecId.
   * @returns The user account.
   * @throws {NotFoundException} If the user is not found.
   */
  async getUser(secUserId: string): Promise<UserAccountDto> {
    const userData = await this.redisService.hgetall(
      redisKeys.userHash(secUserId),
    );

    if (!userData || Object.keys(userData).length === 0) {
      throw new NotFoundException(`用户 ${secUserId} 未找到。`);
    }

    return { ...userData, id: parseInt(userData.id, 10) } as UserAccountDto;
  }

  /**
   * @description 更新指定用户的信息
   * @param secUserId - The user's douyinSecId to update.
   * @param updateUserDto - The data to update.
   * @returns The updated user account.
   * @throws {NotFoundException} If the user is not found.
   */
  async updateUser(
    secUserId: string,
    updateUserDto: UpdateUserAccountDto,
  ): Promise<UserAccountDto> {
    const userKey = redisKeys.userHash(secUserId);
    const exists = await this.redisService.client.exists(userKey);
    if (!exists) {
      throw new NotFoundException(`用户 ${secUserId} 未找到。`);
    }

    // 过滤掉值为 undefined 的字段，避免覆盖
    const updateData = Object.entries(updateUserDto).reduce(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      },
      {},
    );

    if (Object.keys(updateData).length > 0) {
      await this.redisService.client.hset(userKey, updateData);
    }

    this.logger.log(`已更新用户: ${secUserId}`);
    return this.getUser(secUserId);
  }

  /**
   * @description 从 Redis 中删除一个被监控用户
   * @param secUserId - The user's douyinSecId to delete.
   * @throws {NotFoundException} If the user is not found.
   */
  async deleteUser(secUserId: string): Promise<void> {
    const userKey = redisKeys.userHash(secUserId);

    const pipeline = this.redisService.client.pipeline();
    pipeline.srem(redisKeys.monitoringUsersSet(), secUserId);
    pipeline.del(userKey);
    const [sremResult] = await pipeline.exec();

    // sremResult[1] is the number of elements removed from the set.
    if (sremResult[1] === 0) {
      throw new NotFoundException(`用户 ${secUserId} 未在监控列表中找到。`);
    }

    this.logger.log(`已删除用户: ${secUserId}`);
  }
}
