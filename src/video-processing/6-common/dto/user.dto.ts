import { OmitType, PartialType } from '@nestjs/swagger';

/**
 * @file user.dto.ts
 * @description 定义用户账户相关的数据结构
 */

/**
 * @class UserAccountDto
 * @description 完整用户账户的数据结构，通常用于从数据源返回数据时。
 */
export class UserAccountDto {
  /**
   * 用户的唯一标识符，在Redis中可以是创建时的时间戳
   * @example 1672531200000
   */
  id: number;

  /**
   * 用户在抖音上的昵称
   * @example "抖音小助手"
   */
  nickName: string;

  /**
   * 用户在抖音上的唯一 sec_user_id，是主要业务键
   * @example "MS4wLjABAAAAQYgUnUBw_DCgiODRPI9cqvNpkC8gPYZ4O2hdGBo00kA"
   */
  douyinSecId: string;

  /**
   * 用户绑定的Google账户邮箱 (可选)
   * @example "user@gmail.com"
   */
  googleAccount?: string;

  /**
   * 用户绑定的YouTube API密钥 (可选)
   * @example "AIzaSy*******************"
   */
  youtubeApiKey?: string;
}

/**
 * @class CreateUserAccountDto
 * @description 创建新用户时使用的数据传输对象，忽略了自动生成的 `id`。
 */
export class CreateUserAccountDto extends OmitType(UserAccountDto, [
  'id',
] as const) {}

/**
 * @class UpdateUserAccountDto
 * @description 更新用户信息时使用的数据传输对象，所有字段都是可选的。
 */
export class UpdateUserAccountDto extends PartialType(CreateUserAccountDto) {}
