import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { UserService } from '../8-user/user.service';

/**
 * @class ScheduleService
 * @description 核心职责：定时触发所有监控任务的起点。
 *
 * 这个服务使用@Cron装饰器来定义一个定时器，每30秒执行一次。
 * 在定时器触发时，它会从 UserService 中获取所有需要监控的达人列表，
 * 然后将“检查任务”逐个或批量地添加到 "douyin-check-queue" 队列中。
 */
@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    @InjectQueue('douyin-check-queue') private douyinCheckQueue: Queue,
    private readonly userService: UserService,
  ) {}

  /**
   * @description 定时任务：每30秒执行一次，用于触发视频检查流程。
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCron() {
    this.logger.log('定时任务触发：开始从 UserService 获取用户并添加到队列...');

    try {
      // 1. 从 UserService 获取所有需要监控的用户
      const users = await this.userService.getAllUsers();

      if (!users || users.length === 0) {
        this.logger.log('没有需要监控的用户。');
        return;
      }

      this.logger.log(`发现 ${users.length} 个用户需要监控。`);

      // 2. 遍历所有用户，创建检查任务
      for (const user of users) {
        // 确保获取到了有效的数据
        if (!user || !user.douyinSecId) {
          this.logger.warn(`用户数据不完整，跳过此用户。`, user);
          continue;
        }
        // 没有获取google的token不执行
        if (!user.youtubeApiKey) {
          this.logger.warn(
            `无法获取用户 ${user.douyinSecId} 的 googleAccessToken，跳过此用户。`,
          );
          continue;
        }

        // 3. 将完整的用户信息作为任务添加到队列
        await this.douyinCheckQueue.add(
          'check-user', // 任务名称
          user, // 任务数据：完整的用户信息对象
          {
            removeOnComplete: true,
            removeOnFail: 1000,
            // 使用用户ID作为jobId，避免在30秒内重复添加同一个用户的检查任务
            jobId: `check-${user.douyinSecId}`,
          },
        );
      }

      this.logger.log(`成功为 ${users.length} 个用户创建了检查任务。`);
    } catch (error) {
      this.logger.error(
        '从 UserService 获取监控用户并创建任务时发生错误',
        error,
      );
    }
  }
}
