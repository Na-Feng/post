import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { google, Auth } from 'googleapis';
import { UserAccountDto } from '../6-common/dto/user.dto';

import { UserService } from '../8-user/user.service';
@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  constructor(
    private readonly configService: ConfigService,

    private readonly userService: UserService,
  ) {
    this.clientId = this.configService.get<string>('GOOGLE_CLIENT_ID', '');
    this.clientSecret = this.configService.get<string>(
      'GOOGLE_CLIENT_SECRET',
      '',
    );
    this.redirectUri = this.configService.get<string>(
      'GOOGLE_CALLBACK_URL',
      '',
    );
  }
  /**
   * 生成引导用户授权的URL。
   * 这是一个无状态操作，我们可以在方法内部临时创建一个客户端实例。
   */
  public generateAuthUrl(): string {
    // 临时创建一个 "干净" 的客户端，只用于计算URL
    const oauth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri,
    );

    const scopes = ['https://www.googleapis.com/auth/youtube.upload'];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });
  }
  /**
   * 用授权码换取令牌。
   * 这同样是无状态操作（在换取之前）。
   */
  public async getTokensFromCode(
    code: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const oauth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri,
    );

    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.refresh_token) {
      throw new Error('未能获取 Refresh Token。');
    }

    return {
      access_token: tokens.access_token || '',
      refresh_token: tokens.refresh_token,
    };
  }
  /**
   * @description 【已修改】为单次操作创建一个独立的、经过身份验证的客户端实例。
   * @param user - 包含凭证的用户账户对象。
   * @returns 返回一个经过身份验证的、不被共享的 OAuth2 客户端。
   */
  private createAuthenticatedClient(user: UserAccountDto): Auth.OAuth2Client {
    const refreshToken = user.youtubeApiKey;
    if (!refreshToken) {
      throw new Error(`用户 ${user.nickName} 缺少必须的YouTube刷新令牌。`);
    }

    // 创建一个全新的实例，用于承载特定用户的凭证
    const oauth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
    );

    // 2. 【简化逻辑】只设置凭证，让SDK自动处理刷新
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    // 3. 【处理潜在的Refresh Token轮换】
    // 虽然不常见，但Google有时在刷新时会返回一个新的Refresh Token。
    // 设置监听器来捕获并更新它，是更稳健的做法。
    oauth2Client.on('tokens', (tokens) => {
      if (tokens.refresh_token) {
        this.logger.log(
          `用户 ${user.nickName} 获得了一个新的 Refresh Token，正在更新...`,
        );
        // 假设 tasksService.updateUserRefreshToken 是一个专门更新refresh_token的方法
        this.userService
          .updateUser(user.douyinSecId, {
            youtubeApiKey: tokens.refresh_token,
          })
          .catch((err) => {
            this.logger.error(
              `为用户 ${user.nickName} 更新 Refresh Token 失败:`,
              err,
            );
          });
      }
    });

    return oauth2Client;
  }

  /**
   * @description 使用官方SDK将视频上传到YouTube。
   * @param filePath - 视频文件的本地路径。
   * @param metadata - 视频的标题、描述等元数据。
   * @param user - 代表上传视频的用户。
   * @returns 返回上传成功后的 YouTube 视频 URL。
   */
  async uploadVideo(
    filePath: string,
    metadata: {
      title: string;
      description: string;
      tags?: string[];
      privacyStatus?: string;
    },
    user: UserAccountDto,
  ): Promise<string> {
    this.logger.log(`[SDK] 开始为用户 ${user.nickName} 初始化`);
    const auth = this.createAuthenticatedClient(user);
    const youtube = google.youtube({ version: 'v3', auth });
    this.logger.log(`[SDK] 开始为用户 ${user.nickName} 上传视频: ${filePath}`);
    const fileSize = fs.statSync(filePath).size;
    this.logger.log(`[SDK] 视频文件大小: ${fileSize} 字节`);

    const res = await youtube.videos.insert(
      {
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: metadata.title,
            description: metadata.description,
            tags: metadata.tags || [],
            categoryId: '22', // People & Blogs
          },
          status: {
            privacyStatus: metadata.privacyStatus || 'private',
            selfDeclaredMadeForKids: false,
          },
        },
        media: {
          body: fs.createReadStream(filePath),
        },
      },
      {
        // 当网络不稳定时，google-api-nodejs-client 会自动处理重试
        onUploadProgress: (event) => {
          const progress = Math.round((event.bytesRead / fileSize) * 100);
          // 避免过于频繁的日志输出，可以只在特定进度点记录
          if (progress % 10 === 0) {
            this.logger.log(
              `[SDK] 上传进度: ${progress}% (${event.bytesRead} / ${fileSize} 字节)`,
            );
          }
        },
      },
    );

    const youtubeUrl = `https://www.youtube.com/watch?v=${res.data.id}`;
    this.logger.log(
      `[SDK] 用户 ${user.nickName} 的视频已成功上传！URL: ${youtubeUrl}`,
    );

    return youtubeUrl;
  }
}
