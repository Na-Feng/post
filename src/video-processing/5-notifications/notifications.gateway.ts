import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

/**
 * @class NotificationsGateway
 * @description WebSocket 网关，负责与前端进行实时双向通信。
 *
 * 核心职责：
 * 1. 管理 WebSocket 连接的建立、断开和生命周期。
 * 2. 提供一个单例服务，供其他任何后端模块（如Checker, Downloader, Uploader）注入和调用。
 * 3. 定义标准的事件名称（如 'task-started', 'task-progress', 'task-completed', 'task-failed'）。
 * 4. 向所有连接的客户端广播或向特定客户端发送任务状态和进度的更新。
 *
 * @example
 * // 在其他服务中注入并使用:
 * // constructor(private readonly notificationsGateway: NotificationsGateway) {}
 * //
 * // this.notificationsGateway.sendToAll('task-started', { taskId: '123', name: '下载视频' });
 */
@WebSocketGateway({
  cors: {
    origin: '*', // 在生产环境中，应严格限制为前端应用的域名
  },
  path: '/socket.io', // 定义 WebSocket 的路径
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  // WebSocketServer装饰器会注入一个底层的 socket.io 服务器实例
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('NotificationsGateway');

  /**
   * @description 网关初始化时调用的生命周期钩子
   */
  afterInit(server: Server) {
    this.logger.log('WebSocket 网关已初始化');
  }

  /**
   * @description 处理新的客户端连接
   */
  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`客户端已连接: ${client.id}`);
    // 可以向新连接的客户端发送欢迎消息或当前系统状态
    client.emit('welcome', { message: '欢迎连接到 Dragonfly 监控系统' });
  }

  /**
   * @description 处理客户端断开连接
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`客户端已断开: ${client.id}`);
  }

  /**
   * @description 向所有客户端广播消息
   * @param event - 事件名称
   * @param data - 要发送的数据
   */
  sendToAll(event: string, data: any) {
    this.server.emit(event, data);
    this.logger.log(`向所有客户端广播事件 '${event}': ${JSON.stringify(data)}`);
  }

  /**
   * @description 向指定ID的客户端发送消息
   * @param clientId - 目标客户端的 socket.id
   * @param event - 事件名称
   * @param data - 要发送的数据
   */
  sendToClient(clientId: string, event: string, data: any) {
    const client = this.server.sockets.sockets.get(clientId);
    if (client) {
      client.emit(event, data);
      this.logger.log(
        `向客户端 ${clientId} 发送事件 '${event}': ${JSON.stringify(data)}`,
      );
    } else {
      this.logger.warn(`尝试向不存在的客户端 ${clientId} 发送消息失败`);
    }
  }
}
