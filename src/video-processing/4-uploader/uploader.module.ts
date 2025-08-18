import { Module } from '@nestjs/common';
import { YoutubeConsumer } from './youtube.consumer';
import { YoutubeService } from './youtube.service';
import { YoutubeController } from './youtube.controller'; // Import the controller
import { TasksModule } from '../7-tasks/tasks.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from '../8-user/user.module';
@Module({
  imports: [ConfigModule, TasksModule, UserModule], // Import modules whose services are injected
  controllers: [YoutubeController], // Add the controller here
  providers: [YoutubeConsumer, YoutubeService],
  exports: [YoutubeService], // Export the service to make it available in other modules
})
export class UploaderModule {}
