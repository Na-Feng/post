import {
  Controller,
  Get,
  Param,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TasksService, TaskDetails } from './tasks.service';

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
}
