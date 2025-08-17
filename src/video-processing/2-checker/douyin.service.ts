import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { RedisService } from '../6-common/redis/redis.service'; // 路径更新
import { VideoDto } from '../6-common/dto/video.dto';

/**
 * @class DouyinService
 * @description 核心职责：与抖音服务器进行交互，获取和解析数据。
 *
 * 这个服务封装了所有与抖音API或网页请求相关的底层逻辑。
 * 它不关心任务调度或队列，只负责“如何从抖音获取信息”这一件事。
 */
@Injectable()
export class DouyinService {
  private readonly logger = new Logger(DouyinService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * @description 检查单个抖音用户的最新视频，并与缓存对比，判断是否有更新。
   * @param secUserId - 用户的 sec_user_id
   * @returns 如果有新视频，则返回视频信息；否则返回 null。
   */
  async checkNewVideo(secUserId: string): Promise<VideoDto | null> {
    this.logger.log(`正在为抖音用户检查视频: ${secUserId}`);

    const baseUrl = 'https://www.douyin.com/aweme/v1/web/aweme/post/';
    const params = new URLSearchParams({
      device_platform: 'webapp',
      aid: '6383',
      channel: 'channel_pc_web',
      sec_user_id: secUserId,
      max_cursor: '0',
      locate_query: 'false',
      need_time_list: '1',
      time_list_query: '0',
      count: '18',
      publish_video_strategy_type: '2',
      from_user_page: '1',
      platform: 'PC',
    });

    const url = `${baseUrl}?${params.toString()}`;

    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      Referer: `https://www.douyin.com/user/${secUserId}`,
      Cookie: `enter_pc_once=1; UIFID_TEMP=1b474bc7e0db9591e645dd8feb8c65aae4845018effd0c2743039a380ee647409aba29a9b614120a61561696efa02298da7d5e804da23ba43a17ce8912447e882f759689cbaa2c3a5f31a0a930d2696e; x-web-secsdk-uid=05956165-353a-4f75-85a1-a5d296b2bbec; douyin.com; device_web_cpu_core=20; device_web_memory_size=8; architecture=amd64; hevc_supported=true; home_can_add_dy_2_desktop=%220%22; dy_swidth=2560; dy_sheight=1440; fpk1=U2FsdGVkX1+ffUPdyaRrzC5sUfVWS5+m8niF0BCd1TbqhLFaB6qHHa8c3ARkvp7mcDUSTmsjtrrOG54aVcVuzQ==; fpk2=7ddeda88d0c599cc494da0dece6554d5; xgplayer_user_id=554820584211; s_v_web_id=verify_mdmly1y7_f5cLrABh_hTMm_4CVe_9hDA_z2z7vzARlQv2; passport_csrf_token=ba484491282e2cb0652a06d3579e7197; passport_csrf_token_default=ba484491282e2cb0652a06d3579e7197; bd_ticket_guard_client_web_domain=2; __security_mc_1_s_sdk_crypt_sdk=fc8a740b-41d7-8596; UIFID=1b474bc7e0db9591e645dd8feb8c65aae4845018effd0c2743039a380ee64740f37d894440f5e11f6a824f4ad272dcb7cf02f12dcedba79d640e22fc940927d75da7e4ef61fc8c2d7ee74cee10175ce53a2e7f25e97c94e02abe8e6d89e04fdf37d60da22ffefe98d31f871c1e79cbddbec72c398c91ec187ee571d5ca70b15798dae4e93b40bff150e0bc95418106a70808eef1db78324c30af8dcf58220fd4; is_dash_user=1; d_ticket=c4da394e03fb9641d28a0bda29cb3311f7cdc; passport_mfa_token=CjV6C1Am%2BGOQfrnDpnk1IHlZfajOnmvJ%2FPJZaAQCxfKgcnLtLz8E%2BJPFdjuLeQ9y3iPHZCS9BBpKCjwAAAAAAAAAAAAAT1BlQ0SVWbYIhK3YhSuQeQDsSJneAlnzEb2%2FzRMjQnt%2FoVopVOvV753IOxfBDl5B4NAQvcX4DRj2sdFsIAIiAQOMuC18; passport_assist_user=Cj192NcHQwlZFJqKi8kV8vGtCf6IEMlZjNj_ww-ZreLxntb4rhUEmm6COCPt90h-dKtSG1BIz5TRsOtgyxIjGkoKPAAAAAAAAAAAAABPUAP8QiMUvaYWa0ZeKDyqK0gfGBarosbT13mllCPnxPTN5joRoLHZaGBjbJCUphVe3xD7xPgNGImv1lQgASIBA9NFclo%3D; n_mh=gXaJuoxwvrlrJQReYKT6eK9ZbLhwZBa6SYpKUH644II; passport_auth_status=fd4ad6bc915115fdc3847e3099a0d915%2C; passport_auth_status_ss=fd4ad6bc915115fdc3847e3099a0d915%2C; sid_guard=fd8552f7eb462e8cc788cb326e23b80b%7C1754283450%7C5183999%7CFri%2C+03-Oct-2025+04%3A57%3A29+GMT; uid_tt=9a0225ca3df145754a721f2c28ad4aad; uid_tt_ss=9a0225ca3df145754a721f2c28ad4aad; sid_tt=fd8552f7eb462e8cc788cb326e23b80b; sessionid=fd8552f7eb462e8cc788cb326e23b80b; sessionid_ss=fd8552f7eb462e8cc788cb326e23b80b; session_tlb_tag=sttt%7C12%7C_YVS9-tGLozHiMsybiO4C__________9ozyrog7_Z_YRv1JGObVny9Xt0_fQykIjcj_3rVGYRck%3D; is_staff_user=false; sid_ucp_v1=1.0.0-KDcyOTRkM2QxZmNkYjc2OTEyYWEzMDBiOWJjYzYzMGRmOTBmYWMxNjQKHwjZraf1igMQuvvAxAYY7zEgDDCl5-zeBTgCQPEHSAQaAmxmIiBmZDg1NTJmN2ViNDYyZThjYzc4OGNiMzI2ZTIzYjgwYg; ssid_ucp_v1=1.0.0-KDcyOTRkM2QxZmNkYjc2OTEyYWEzMDBiOWJjYzYzMGRmOTBmYWMxNjQKHwjZraf1igMQuvvAxAYY7zEgDDCl5-zeBTgCQPEHSAQaAmxmIiBmZDg1NTJmN2ViNDYyZThjYzc4OGNiMzI2ZTIzYjgwYg; login_time=1754283455551; _bd_ticket_crypt_cookie=46eedcaa98180e478b4fd6a7aefab8c0; __security_mc_1_s_sdk_sign_data_key_web_protect=3ce689d6-4322-8352; __security_mc_1_s_sdk_cert_key=d309c5dd-4f03-a274; __security_server_data_status=1; SelfTabRedDotControl=%5B%5D; xgplayer_device_id=48660057247; passport_fe_beating_status=false; volume_info=%7B%22volume%22%3A0.983%2C%22isMute%22%3Atrue%2C%22isUserMute%22%3Atrue%7D; stream_player_status_params=%22%7B%5C%22is_auto_play%5C%22%3A0%2C%5C%22is_full_screen%5C%22%3A0%2C%5C%22is_full_webscreen%5C%22%3A0%2C%5C%22is_mute%5C%22%3A1%2C%5C%22is_speed%5C%22%3A1%2C%5C%22is_visible%5C%22%3A1%7D%22; xg_device_score=7.147114538176984; WallpaperGuide=%7B%22showTime%22%3A1755045034767%2C%22closeTime%22%3A0%2C%22showCount%22%3A1%2C%22cursor1%22%3A16%2C%22cursor2%22%3A4%7D; download_guide=%223%2F20250814%2F1%22; publish_badge_show_info=%221%2C0%2C0%2C1755173664105%22; FOLLOW_LIVE_POINT_INFO=%22MS4wLjABAAAAzJG5dZD2PGDGbMbbAIjRD1cBfPEDkyW67jar777MpBQ%2F1755187200000%2F0%2F1755173679183%2F0%22; __ac_nonce=0689e7d5600f48a0d4b0d; __ac_signature=_02B4Z6wo00f01nZPeBAAAIDAlYCIh43eOh52b3yAAPUc43; stream_recommend_feed_params=%22%7B%5C%22cookie_enabled%5C%22%3Atrue%2C%5C%22screen_width%5C%22%3A2560%2C%5C%22screen_height%5C%22%3A1440%2C%5C%22browser_online%5C%22%3Atrue%2C%5C%22cpu_core_num%5C%22%3A20%2C%5C%22device_memory%5C%22%3A8%2C%5C%22downlink%5C%22%3A1.35%2C%5C%22effective_type%5C%22%3A%5C%223g%5C%22%2C%5C%22round_trip_time%5C%22%3A350%7D%22; strategyABtestKey=%221755217242.287%22; FOLLOW_NUMBER_YELLOW_POINT_INFO=%22MS4wLjABAAAAzJG5dZD2PGDGbMbbAIjRD1cBfPEDkyW67jar777MpBQ%2F1755273600000%2F0%2F1755217242949%2F0%22; bd_ticket_guard_client_data=eyJiZC10aWNrZXQtZ3VhcmQtdmVyc2lvbiI6MiwiYmQtdGlja2V0LWd1YXJkLWl0ZXJhdGlvbi12ZXJzaW9uIjoxLCJiZC10aWNrZXQtZ3VhcmQtcmVlLXB1YmxpYy1rZXkiOiJCQzJSQi9LSkdWVFp3UXhIa09CVU9XNW9UMngxUFNDbThCZkZXRGVrTjRvbi9DWXppVmp1aG5lQW1qWEtEL2R4SzNGQ1EwWXNhRVVZZ01yZ0twcENUazg9IiwiYmQtdGlja2V0LWd1YXJkLXdlYi12ZXJzaW9uIjoyfQ%3D%3D; ttwid=1%7CyJxfwFKOk2naMs8XzYilpeh2QDa2l45ND1KX-lm7DHE%7C1755217248%7C35ea98f2f1eaed373b68cbc1b32df6d193fa55a5d526edc872fc441549e25007; biz_trace_id=ea0a7694; sdk_source_info=7e276470716a68645a606960273f276364697660272927676c715a6d6069756077273f276364697660272927666d776a68605a607d71606b766c6a6b5a7666776c7571273f275e58272927666a6b766a69605a696c6061273f27636469766027292762696a6764695a7364776c6467696076273f275e582729277672715a646971273f2763646976602729277f6b5a666475273f2763646976602729276d6a6e5a6b6a716c273f2763646976602729276c6b6f5a7f6367273f27636469766027292771273f2734303235303732343730303234272927676c715a75776a716a666a69273f2763646976602778; bit_env=ciR4fMjDPuoDFUNnjx-lPFbz8gNKKa3yrO2r-XasPPk-_sBNlbw5lPjaEXCKb_O65bwqwCxwTOSSx6ppEPD878wZvsmuBvsZ2BS7E4TPSNilD0Q4IPw2CqJC3sPOpILzCDDZS1wyP0oJbEYbbJg7Ud4vXmS-NOxHfysqXqMwo5bZCiIfFZx6Wr6XI6XE2_1Ygy5njdyVkUOZWNiupy7gcqXotS2YJencgvBqrAKyNRkyODr0hfCv78QtxWYwl8wSSvMJ8mZsXRrkSs6C7pcEbtkQIYX6Uwqw61jt1AtvMqD0sAHlNm4Gb1F0vpL463A-nzNUxz3Xx3mQtS8w4wrNX6Eq4VapwWfko5ssvqFak5rAMJ8h7drR-5nU0xlJN7ZuJuD5xK7nujsA5SqiyWRoAjtoaG6d-yJ2YnszoO1AkXjqj0D18EHqyZPnDZm1m8opuTBebHww7PnQZ9CSH3iKMpggkDRVaVVJpdPWTabRD-Kc0nsNAQ_VmC75yMb091Bg; gulu_source_res=eyJwX2luIjoiYTlmMjU3NzAxMWQ2OTIyYjc5NWQ5Zjk3NjY1OWVkOTNkMGQ2NjBjMWZhMmNkYzdjMGI4NmI5YTU2YjlhYmU1OCJ9; passport_auth_mix_state=oaqzu85762ot5j6fjjs2onqrysy5ke9g; odin_tt=35c3841a2a9a60ba4af2e760f446edd677bc2e52944d9c8111098db255a016c09f149c187d354b7f8819897d741daf53d120c4d88960122499671dda37be00d7; IsDouyinActive=true`, // TODO: 安全管理
    };

    const REDIS_KEY = `douyin:user:${secUserId}:latest_video`;
    let cachedLatestAwemeId: string | null = null;
    let cachedLatestCreateTime: number = 0;

    try {
      const cachedData = await this.redisService.hgetall(REDIS_KEY);
      if (cachedData && cachedData.aweme_id && cachedData.create_time) {
        cachedLatestAwemeId = cachedData.aweme_id;
        cachedLatestCreateTime = parseInt(cachedData.create_time, 10);
        this.logger.log(
          `从缓存中读取到用户 ${secUserId} 的数据: aweme_id=${cachedLatestAwemeId}`,
        );
      }
    } catch (redisError) {
      this.logger.error(
        `为用户 ${secUserId} 读取缓存失败: ${redisError.message}`,
      );
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { headers }),
      );
      this.logger.log(`成功获取用户 ${secUserId} 的主页数据`);

      const awemeList = response.data?.aweme_list;
      if (!awemeList || awemeList.length === 0) {
        this.logger.log(`用户 ${secUserId} 的主页没有视频。`);
        return null;
      }

      const nonTopVideos = awemeList.filter((video: any) => video.is_top !== 1);
      if (nonTopVideos.length === 0) {
        this.logger.log(`用户 ${secUserId} 没有非置顶的视频。`);
        return null;
      }

      const latestVideo = nonTopVideos[0];
      const currentAwemeId = latestVideo.aweme_id;
      const currentCreateTime = latestVideo.create_time;

      let isNewVideo = false;
      if (cachedLatestAwemeId === null) {
        isNewVideo = true;
        this.logger.log(`首次检查用户 ${secUserId}，将存储最新视频信息。`);
      } else if (
        currentAwemeId !== cachedLatestAwemeId &&
        currentCreateTime > cachedLatestCreateTime
      ) {
        isNewVideo = true;
        this.logger.log(`检测到用户 ${secUserId} 的新视频!`);
      } else {
        this.logger.log(`用户 ${secUserId} 没有新视频。`);
      }

      if (isNewVideo) {
        await this.redisService.hmset(REDIS_KEY, {
          aweme_id: currentAwemeId,
          create_time: currentCreateTime.toString(),
        });

        const videoUrl = latestVideo.video?.play_addr?.url_list?.[0];
        if (videoUrl) {
          this.logger.log(`新视频的URL: ${videoUrl}`);
          return {
            aweme_id: currentAwemeId,
            create_time: currentCreateTime,
            video_url: videoUrl,
            title: latestVideo.desc,
            digg_count: latestVideo.statistics.digg_count,
            sec_user_id: secUserId,
          };
        } else {
          this.logger.warn(
            `发现新视频但无法获取URL, 用户: ${secUserId}, Aweme ID: ${currentAwemeId}`,
          );
          return null;
        }
      }
      return null;
    } catch (error) {
      this.logger.error(`获取用户 ${secUserId} 的数据失败: ${error.message}`);
      throw error;
    }
  }
}
