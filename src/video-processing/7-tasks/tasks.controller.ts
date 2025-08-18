import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TasksService, TaskDetails } from './tasks.service';
import {
  UserAccountDto,
  CreateUserAccountDto,
  UpdateUserAccountDto,
} from '../6-common/dto/user.dto';

/**
 * @class TasksController
 * @description 提供用于查询任务列表和管理用户账户的 API 端点
 */
@Controller('tasks') // 所有路由都以 /tasks 开头
export class TasksController {
  private readonly logger = new Logger(TasksController.name);

  constructor(private readonly tasksService: TasksService) {}

  // --- Task Endpoints ---

  /**
   * @description GET /tasks/:secUserId
   * @param secUserId - 要查询的用户的 sec_user_id
   * @returns 返回该用户的任务列表，按创建时间倒序排列
   */
  @Get(':secUserId')
  @HttpCode(HttpStatus.OK)
  async getTasksForUser(
    @Param('secUserId') secUserId: string,
  ): Promise<TaskDetails[]> {
    this.logger.log(`收到API请求，查询用户 ${secUserId} 的任务列表`);
    return this.tasksService.getTasksForUser(secUserId);
  }

  // --- User Account Endpoints ---

  /**
   * @description POST /tasks/users - 添加一个新的被监控用户
   * @param createUserDto - 创建用户所需的数据
   */
  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  async addUser(
    @Body() createUserDto: CreateUserAccountDto,
  ): Promise<UserAccountDto> {
    this.logger.log(`收到API请求，添加新用户: ${createUserDto.nickName}`);
    return this.tasksService.addUser(createUserDto);
  }

  /**
   * @description GET /tasks/users - 获取所有被监控用户的列表
   */
  @Get('users')
  @HttpCode(HttpStatus.OK)
  async getAllUsers(): Promise<UserAccountDto[]> {
    this.logger.log('收到API请求，获取所有用户列表');
    return this.tasksService.getAllUsers();
  }

  /**
   * @description GET /tasks/users/:secUserId - 获取指定用户的详细信息
   * @param secUserId - 用户的 douyinSecId
   */
  @Get('users/:secUserId')
  @HttpCode(HttpStatus.OK)
  async getUser(
    @Param('secUserId') secUserId: string,
  ): Promise<UserAccountDto> {
    this.logger.log(`收到API请求，获取用户 ${secUserId} 的详细信息`);
    return this.tasksService.getUser(secUserId);
  }

  /**
   * @description PATCH /tasks/users/:secUserId - 更新指定用户的信息
   * @param secUserId - 用户的 douyinSecId
   * @param updateUserDto - 要更新的数据
   */
  @Patch('users/:secUserId')
  @HttpCode(HttpStatus.OK)
  async updateUser(
    @Param('secUserId') secUserId: string,
    @Body() updateUserDto: UpdateUserAccountDto,
  ): Promise<UserAccountDto> {
    this.logger.log(`收到API请求，更新用户 ${secUserId}`);
    return this.tasksService.updateUser(secUserId, updateUserDto);
  }

  /**
   * @description DELETE /tasks/users/:secUserId - 删除一个被监控用户
   * @param secUserId - 用户的 douyinSecId
   */
  @Delete('users/:secUserId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('secUserId') secUserId: string): Promise<void> {
    this.logger.log(`收到API请求，删除用户 ${secUserId}`);
    return this.tasksService.deleteUser(secUserId);
  }
}
