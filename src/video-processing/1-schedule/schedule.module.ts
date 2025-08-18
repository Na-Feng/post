import { Module } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { UserModule } from '../8-user/user.module';

@Module({
  imports: [UserModule],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}