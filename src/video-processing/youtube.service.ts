import { Injectable, Logger } from '@nestjs/common';
import { UserAccount } from './dto/user-account.dto';

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);

  async uploadVideo(user: UserAccount, videoPath: string): Promise<string> {
    this.logger.debug(`Uploading video ${videoPath} for Google user: ${user.googleAccount}`);
    // Simulate API call using user.youtubeApiKey
    await new Promise(resolve => setTimeout(resolve, 500));
    const mockYoutubeId = `https://youtube.com/watch?v=${Math.random().toString(36).substring(2, 15)}`;
    this.logger.debug(`Successfully uploaded. YouTube ID: ${mockYoutubeId}`);
    return mockYoutubeId;
  }
}
