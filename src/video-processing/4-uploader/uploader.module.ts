import { Module } from '@nestjs/common';
import { YoutubeConsumer } from './youtube.consumer';
import { YoutubeService } from './youtube.service';
import { TasksModule } from '../7-tasks/tasks.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule, TasksModule], // Import modules whose services are injected
  providers: [YoutubeConsumer, YoutubeService],
  exports: [YoutubeService], // Export the service to make it available in other modules
})
export class UploaderModule {}
