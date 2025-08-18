/**
 * @file task.dto.ts
 * @description 定义队列中任务的数据结构
 */

/**
 * @interface DownloadTaskDto
 * @description “视频下载”队列中任务的数据结构定义
 */
export interface DownloadTaskDto {
  aweme_id: string; // 视频ID
  sec_user_id: string; // 作者ID
  video_url: string; // 视频下载地址
  title: string; // 视频标题
  digg_count: string; // 点赞数
}

/**
 * @interface UploadTaskDto
 * @description “视频上传”队列中任务的数据结构定义
 */
export interface UploadTaskDto {
  filePath: string; // 本地视频文件路径
  title: string; // 上传到YouTube的标题
  description: string; // 上传到YouTube的描述
}
