import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { YoutubeService } from './youtube.service';
import type { Response } from 'express';

@Controller('youtube')
export class YoutubeController {
  constructor(private readonly youtubeService: YoutubeService) {}

  @Get('auth-url/:douyinSecId')
  async getGoogleAuthUrl(@Param('douyinSecId') douyinSecId: string) {
    const authUrl = this.youtubeService.getGoogleAuthUrl(douyinSecId);
    return { authUrl };
  }

  @Get('oauth2callback')
  async oauth2callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      const douyinSecId = state; // Assuming state directly contains douyinSecId
      await this.youtubeService.handleGoogleOAuthCallback(code, douyinSecId);
      // Redirect to a frontend success page or close the popup
      res.redirect('http://localhost:5173/oauth-success'); // Adjust frontend success URL
    } catch (error) {
      console.error('Google OAuth Callback Error:', error);
      res.redirect('http://localhost:5173/oauth-failure'); // Adjust frontend failure URL
    }
  }
}
