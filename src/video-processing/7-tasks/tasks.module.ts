import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { RedisModule } from '../6-common/redis/redis.module';

@Module({
  imports: [
    RedisModule, // 导入 Redis 模块以使用 RedisService
  ],
  providers: [
    TasksService, // 注册 TasksService
  ],
  controllers: [
    TasksController, // 注册 TasksController
  ],
  exports: [
    TasksService, // 导出 TasksService，以便 Downloader 等其他模块可以注入并使用它
  ],
})
export class TasksModule {}
