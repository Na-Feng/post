import { Controller, Get, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import Redis, { Cluster } from 'ioredis';

@Controller('tasks')
export class TasksController implements OnModuleInit {
  private readonly logger = new Logger(TasksController.name);
  private redis: Redis | Cluster;

  constructor(@InjectQueue('video') private readonly videoQueue: Queue) {}

  async onModuleInit() {
    this.redis = await this.videoQueue.client;
  }

  @Get()
  async getAllTasks() {
    this.logger.log('Fetching all tasks from Redis...');
    const keys = await this.redis.keys('task:*');
    if (!keys.length) {
      return [];
    }
    const pipeline = this.redis.pipeline();
    keys.forEach((key) => {
      pipeline.hgetall(key);
    });
    const results = await pipeline.exec();
    // results is an array of [error, data] tuples
    if (results === null) {
      return [];
    }
    return results.map((result) => result[1]);
  }
}