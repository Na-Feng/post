import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { RedisModule } from '../6-common/redis/redis.module';
import { UploaderModule } from '../4-uploader/uploader.module'; // New import

@Module({
  imports: [RedisModule, UploaderModule], // Added UploaderModule
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService], // 导出 UserService 以便其他模块可以使用
})
export class UserModule {}