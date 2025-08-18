import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { RedisService } from '../6-common/redis/redis.service';
import { redisKeys } from '../6-common/redis/redis.keys';
import {
  UserAccountDto,
  CreateUserAccountDto,
  UpdateUserAccountDto,
} from '../6-common/dto/user.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * @description 添加一个新的被监控用户到 Redis
   * @param createUserDto - 创建用户所需的数据
   * @returns The newly created user account.
   * @throws {ConflictException} If the user already exists.
   */
  async addUser(createUserDto: CreateUserAccountDto): Promise<UserAccountDto> {
    const { douyinSecId } = createUserDto;
    const userKey = redisKeys.userHash(douyinSecId);

    const exists = await this.redisService.client.exists(userKey);
    if (exists) {
      throw new ConflictException(`用户 ${douyinSecId} 已存在。`);
    }

    const newUser: UserAccountDto = {
      id: Date.now(), // 使用时间戳作为简单ID
      ...createUserDto,
    };

    const pipeline = this.redisService.client.pipeline();
    pipeline.sadd(redisKeys.monitoringUsersSet(), douyinSecId);
    pipeline.hset(userKey, newUser);
    await pipeline.exec();

    this.logger.log(`已添加新用户: ${newUser.nickName} (${douyinSecId})`);
    return newUser;
  }

  /**
   * @description 获取所有被监控用户的列表
   * @returns A list of all user accounts.
   */
  async getAllUsers(): Promise<UserAccountDto[]> {
    const userIds = await this.redisService.client.smembers(
      redisKeys.monitoringUsersSet(),
    );
    if (!userIds || userIds.length === 0) {
      return [];
    }

    const pipeline = this.redisService.client.pipeline();
    userIds.forEach((id) => pipeline.hgetall(redisKeys.userHash(id)));
    const results = await pipeline.exec();
    if (!results) return [];
    return results
      .map(([err, data]: [null, Record<string, string>]) => {
        if (err || !data) return null;
        return { ...data, id: parseInt(data.id, 10) } as UserAccountDto;
      })
      .filter((user): user is UserAccountDto => user !== null);
  }

  /**
   * @description 获取指定用户的详细信息
   * @param secUserId - The user's douyinSecId.
   * @returns The user account.
   * @throws {NotFoundException} If the user is not found.
   */
  async getUser(secUserId: string): Promise<UserAccountDto> {
    const userData = await this.redisService.hgetall(
      redisKeys.userHash(secUserId),
    );

    if (!userData || Object.keys(userData).length === 0) {
      throw new NotFoundException(`用户 ${secUserId} 未找到。`);
    }

    return { ...userData, id: parseInt(userData.id, 10) } as UserAccountDto;
  }

  /**
   * @description 更新指定用户的信息
   * @param secUserId - The user's douyinSecId to update.
   * @param updateUserDto - The data to update.
   * @returns The updated user account.
   * @throws {NotFoundException} If the user is not found.
   */
  async updateUser(
    secUserId: string,
    updateUserDto: UpdateUserAccountDto,
  ): Promise<UserAccountDto> {
    const userKey = redisKeys.userHash(secUserId);
    const exists = await this.redisService.client.exists(userKey);
    if (!exists) {
      throw new NotFoundException(`用户 ${secUserId} 未找到。`);
    }

    // 过滤掉值为 undefined 的字段，避免覆盖
    const updateData = Object.entries(updateUserDto).reduce(
      (acc, [key, value]: [string, string]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      },
      {},
    );

    if (Object.keys(updateData).length > 0) {
      await this.redisService.client.hset(userKey, updateData);
    }

    this.logger.log(`已更新用户: ${secUserId}`);
    return this.getUser(secUserId);
  }

  /**
   * @description 从 Redis 中删除一个被监控用户
   * @param secUserId - The user's douyinSecId to delete.
   * @throws {NotFoundException} If the user is not found.
   */
  async deleteUser(secUserId: string): Promise<void> {
    const userKey = redisKeys.userHash(secUserId);

    const pipeline = this.redisService.client.pipeline();
    pipeline.srem(redisKeys.monitoringUsersSet(), secUserId);
    pipeline.del(userKey);

    const results = await pipeline.exec();

    if (!results) {
      throw new Error('Pipeline 执行 返回 null');
    }

    // 这里 TS 已经知道 results 一定是 [Error | null, unknown][]
    const [sremResult] = results;

    // sremResult[1] is the number of elements removed from the set.
    if (sremResult[1] === 0) {
      throw new NotFoundException(`用户 ${secUserId} 未在监控列表中找到。`);
    }

    this.logger.log(`已删除用户: ${secUserId}`);
  }
}
