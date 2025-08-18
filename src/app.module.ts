import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { VideoProcessingModule } from './video-processing/video-processing.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * @class AppModule
 * @description 应用的根模块 (Root Module)
 *
 * 核心职责：
 * 1. 导入并配置应用所需的基础设施模块（如数据库连接、环境变量、任务调度等）。
 * 2. 导入应用的核心业务模块（在这里是 VideoProcessingModule）。
 */
@Module({
  imports: [
    // 1. 配置模块，用于读取 .env 文件，并设为全局可用
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. 启用定时任务调度功能
    ScheduleModule.forRoot(),

    // 3. 异步配置 BullMQ 的 Redis 连接，确保能从 ConfigService 获取配置
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
          db: configService.get<number>('REDIS_DB', 0),
        },
      }),
      inject: [ConfigService],
    }),

    // 4. 导入我们的核心业务模块，所有功能从这里开始
    VideoProcessingModule,
  ],
  // 控制器和提供者数组已空，因为所有具体实现都封装在子模块中了
  controllers: [],
  providers: [],
})
export class AppModule {}
