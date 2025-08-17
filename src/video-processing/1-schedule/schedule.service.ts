import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { RedisService } from '../6-common/redis/redis.service';
import { UserAccountDto } from '../6-common/dto/user.dto';

/**
 * @class ScheduleService
 * @description 核心职责：定时触发所有监控任务的起点。
 *
 * 这个服务使用@Cron装饰器来定义一个定时器，每30秒执行一次。
 * 在定时器触发时，它会从 Redis 中获取所有需要监控的达人列表，
 * 然后将“检查任务”逐个或批量地添加到 "douyin-check-queue" 队列中。
 */
@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    // 注入“抖音检查”队列，用于创建任务
    @InjectQueue('douyin-check-queue') private douyinCheckQueue: Queue,
    // 注入 Redis 服务
    private readonly redisService: RedisService,
  ) {}

  /**
   * @description 定时任务：每30秒执行一次，用于触发视频检查流程。
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCron() {
    this.logger.log('定时任务触发：开始从 Redis 获取用户并添加到队列...');

    try {
      // 1. 从 Redis 的 Set 中获取所有需要监控的用户的 sec_user_id
      // 我们约定存储用户ID的Set的key是 'monitoring:users'
      const userIds =
        await this.redisService.client.smembers('monitoring:users');

      if (!userIds || userIds.length === 0) {
        this.logger.log('没有需要监控的用户。');
        return;
      }

      this.logger.log(`发现 ${userIds.length} 个用户需要监控。`);

      // 2. 遍历所有用户ID，获取他们的详细信息并创建任务
      for (const secUserId of userIds) {
        // 我们约定用户数据存储在名为 `user:${secUserId}` 的 Hash 中
        const userData = await this.redisService.hgetall(`user:${secUserId}`);

        // 确保获取到了有效的数据
        if (!userData || !userData.douyinSecId) {
          this.logger.warn(
            `无法获取用户 ${secUserId} 的详细信息或信息不完整，跳过此用户。`,
          );
          continue;
        }
        // 没有获取google的token不执行
        if (!userData.youtubeApiKey) {
          this.logger.warn(
            `无法获取用户 ${secUserId} 的googleAccessToken，跳过此用户。`,
          );
          continue;
        }

        // 将从 Redis 获取的字符串数据转换成符合 DTO 的对象
        const taskPayload: UserAccountDto = {
          id: parseInt(userData.id, 10),
          nickName: userData.nickName,
          douyinSecId: userData.douyinSecId,
          googleAccount: userData.googleAccount,
          youtubeApiKey: userData.youtubeApiKey,
        };

        // 3. 将完整的用户信息作为任务添加到队列
        await this.douyinCheckQueue.add(
          'check-user', // 任务名称
          taskPayload, // 任务数据：完整的用户信息对象
          {
            removeOnComplete: true,
            removeOnFail: 1000,
            // 使用用户ID作为jobId，避免在30秒内重复添加同一个用户的检查任务
            jobId: `check-${secUserId}`,
          },
        );
      }

      this.logger.log(`成功为 ${userIds.length} 个用户创建了检查任务。`);
    } catch (error) {
      this.logger.error('从 Redis 获取监控用户并创建任务时发生错误', error);
    }
  }
}
