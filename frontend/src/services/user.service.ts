import type {
  UserAccountDto,
  CreateUserAccountDto,
  UpdateUserAccountDto,
} from '../types/user.dto';
import http from '../utils/http'; // Import the axios instance

class UserService {
  /**
   * 获取所有用户账户列表。
   * @returns {Promise<UserAccountDto[]>} - 用户账户数组。
   */
  async getUsers(): Promise<UserAccountDto[]> {
    return await http.get<UserAccountDto[]>('/users');
  }

  /**
   * 创建一个新的用户账户。
   * @param {CreateUserAccountDto} user - 包含新用户信息的 DTO。
   * @returns {Promise<UserAccountDto>} - 创建成功的用户账户信息。
   */
  async createUser(user: CreateUserAccountDto): Promise<UserAccountDto> {
    return await http.post<UserAccountDto>('/users', user);
  }

  /**
   * 更新指定用户账户的信息。
   * @param {string} secUserId - 要更新的用户账户的唯一标识符。
   * @param {UpdateUserAccountDto} user - 包含更新用户信息的 DTO。
   * @returns {Promise<UserAccountDto>} - 更新后的用户账户信息。
   */
  async updateUser(
    secUserId: string,
    user: UpdateUserAccountDto,
  ): Promise<UserAccountDto> {
    return await http.patch<UserAccountDto>(`/users/${secUserId}`, user);
  }

  /**
   * 删除指定的用户账户。
   * @param {string} secUserId - 要删除的用户账户的唯一标识符。
   * @returns {Promise<void>}
   */
  async deleteUser(secUserId: string): Promise<void> {
    return await http.delete(`/users/${secUserId}`);
  }

  /**
   * 获取 Google OAuth 授权 URL。
   * @param {string} secUserId - 用户的唯一标识符，用于生成授权 URL。
   * @returns {Promise<{ authUrl: string }>} - 包含 Google 授权 URL 的对象。
   */
  async getGoogleAuthUrl(secUserId: string): Promise<{ authUrl: string }> {
    return await http.get<{ authUrl: string }>(
      `/youtube/auth-url/${secUserId}`,
    );
  }

  /**
   * 处理 Google OAuth 回调，将授权码发送到后端进行处理。
   * @param {object} params - 参数对象。
   * @param {string} params.code - Google OAuth 授权码。
   * @param {string} params.douyinSecId - 抖音用户ID，用于关联 Google 账号。
   * @returns {Promise<UserAccountDto>} - 更新后的用户账户信息。
   */
  async handleGoogleOAuthCallback({
    code,
    douyinSecId,
  }: {
    code: string;
    douyinSecId: string;
  }): Promise<UserAccountDto> {
    return await http.post<UserAccountDto>('/youtube/oauth-callback', {
      code,
      douyinSecId,
    });
  }
}

export const userService = new UserService();
