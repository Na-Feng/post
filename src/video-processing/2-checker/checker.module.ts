import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DouyinConsumer } from './douyin.consumer';
import { DouyinService } from './douyin.service';

@Module({
  imports: [HttpModule], // RedisModule 已是全局，无需在此导入
  providers: [DouyinConsumer, DouyinService],
})
export class CheckerModule {}