/**
 * @file video.dto.ts
 * @description 定义视频相关的数据结构
 */

/**
 * @interface VideoDto
 * @description 从抖音API解析出的原始视频信息
 */
export interface VideoDto {
  aweme_id: string; // 视频ID
  video_url: string; // 视频下载地址
  title: string; // 视频标题
  sec_user_id: string; // 作者ID
  digg_count: number; // 点赞数
  create_time: number; // 发布时间戳 (秒)
}
