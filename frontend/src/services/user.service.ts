import type {
  UserAccountDto,
  CreateUserAccountDto,
  UpdateUserAccountDto,
} from '../types/user.dto';

const API_BASE_URL = 'http://localhost:3000';

class UserService {
  async getUsers(): Promise<UserAccountDto[]> {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) {
      throw new Error('获取用户列表失败');
    }
    return response.json();
  }

  async createUser(user: CreateUserAccountDto): Promise<UserAccountDto> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '创建用户失败');
    }
    return response.json();
  }

  async updateUser(
    secUserId: string,
    user: UpdateUserAccountDto,
  ): Promise<UserAccountDto> {
    const response = await fetch(`${API_BASE_URL}/users/${secUserId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '更新用户失败');
    }
    return response.json();
  }

  async deleteUser(secUserId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${secUserId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '删除用户失败');
    }
  }
}

export const userService = new UserService();
