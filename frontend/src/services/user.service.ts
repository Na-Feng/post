import type {
  UserAccountDto,
  CreateUserAccountDto,
  UpdateUserAccountDto,
} from '../types/user.dto';
import http from '../utils/http'; // Import the axios instance

class UserService {
  async getUsers(): Promise<UserAccountDto[]> {
    try {
      const response = await http.get<UserAccountDto[]>('/users');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '获取用户列表失败');
    }
  }

  async createUser(user: CreateUserAccountDto): Promise<UserAccountDto> {
    try {
      const response = await http.post<UserAccountDto>('/users', user);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '创建用户失败');
    }
  }

  async updateUser(
    secUserId: string,
    user: UpdateUserAccountDto,
  ): Promise<UserAccountDto> {
    try {
      const response = await http.patch<UserAccountDto>(
        `/users/${secUserId}`,
        user,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '更新用户失败');
    }
  }

  async deleteUser(secUserId: string): Promise<void> {
    try {
      await http.delete(`/users/${secUserId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '删除用户失败');
    }
  }

  async getGoogleAuthUrl(secUserId: string): Promise<{ authUrl: string }> {
    try {
      const response = await http.get<{ authUrl: string }>(
        `/youtube/auth-url/${secUserId}`,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || '获取 Google 授权链接失败',
      );
    }
  }
}

export const userService = new UserService();
