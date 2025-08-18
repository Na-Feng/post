import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * @class RedisService
 * @description 核心职责：提供一个封装好的、可注入的 Redis 客户端实例。
 *
 * 这个服务处理 Redis 的连接、断开和错误处理，并提供了一些常用的 Redis 命令的便捷方法。
 * 它是整个应用中所有需要与 Redis 交互的模块的基础设施。
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  // 客户端实例是公共的，以便在其他服务中可以直接访问 ioredis 的所有方法
  public client: Redis;

  constructor(private readonly configService: ConfigService) {}

  /**
   * @description NestJS 模块初始化时调用的生命周期钩子。
   * 在这里建立与 Redis 服务器的连接。
   */
  async onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD');
    const db = this.configService.get<number>('REDIS_DB', 0);

    this.client = new Redis({
      host,
      port,
      password,
      db,
      // 添加重连策略，增强系统稳定性
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('connect', () => {
      this.logger.log('Redis 客户端已成功连接');
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis 客户端发生错误', err);
    });
  }

  /**
   * @description NestJS 模块销毁时调用的生命周期钩子。
   * 在这里优雅地断开与 Redis 的连接。
   */
  async onModuleDestroy() {
    await this.client.quit();
    this.logger.log('Redis 客户端连接已断开');
  }

  // --- 常用的 Redis 命令便捷方法 ---

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<string | null> {
    if (ttl) {
      // 'EX' 表示设置秒级过期时间
      return this.client.set(key, value, 'EX', ttl);
    }
    return this.client.set(key, value);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.client.hgetall(key);
  }

  async hmset(key: string, data: Record<string, any>): Promise<'OK' | number> {
    // ioredis v5+ 中，HMSET 已被废弃，推荐使用 HSET
    return this.client.hset(key, data);
  }
}
