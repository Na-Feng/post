import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global() // 将此模块标记为全局
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}