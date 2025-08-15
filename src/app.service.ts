import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);

  constructor(
    @InjectQueue('douyin-check-queue') private douyinCheckQueue: Queue,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async onModuleInit() {
    // 示例：在应用启动时添加一个测试任务
    // 在实际应用中，这些任务会由定时调度器或其他业务逻辑添加
    const testSecUserId =
      'MS4wLjABAAAAI6TaZ1DuCqzZc8Meu3BKyk4O-d8Q9WIUCP_rdbIsuC8EJKfgyv5KG9KS1qypAdrD'; // 替换为实际的抖音sec_user_id
    this.logger.log(
      `Adding test job for user: ${testSecUserId} to douyin-check-queue`,
    );
    await this.douyinCheckQueue.add(
      'check-douyin-user', // 任务名称
      { secUserId: testSecUserId }, // 任务数据
      { removeOnComplete: true, removeOnFail: false }, // 任务选项
    );
    this.logger.log('Test job added.');
  }

  async addDouyinCheckJob(secUserId: string) {
    this.logger.log(
      `Manually adding job for user: ${secUserId} to douyin-check-queue`,
    );
    await this.douyinCheckQueue.add(
      'check-douyin-user',
      { secUserId: secUserId },
      { removeOnComplete: true, removeOnFail: false },
    );
    this.logger.log('Job added successfully.');
  }
}
