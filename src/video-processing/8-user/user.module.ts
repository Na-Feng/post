import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { RedisModule } from '../6-common/redis/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService], // 导出 UserService 以便其他模块可以使用
})
export class UserModule {}
