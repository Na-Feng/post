import { io, Socket } from 'socket.io-client';
import { reactive } from 'vue';

// 定义任务对象的数据结构，与后端保持一致
export interface Task {
  taskId: string;
  aweme_id: string;
  sec_user_id: string;
  title: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  progress: number;
  message: string;
  createdAt: string;
}

// 使用一个 Class 来封装所有 Socket 逻辑
class SocketService {
  private socket: Socket;
  
  // 创建一个响应式的 state 对象，用于在 UI 中展示连接状态
  public state = reactive({
    isConnected: false,
  });

  // 创建一个响应式的 Map，作为我们前端所有任务的“中央数据库”
  // Key 是 taskId，Value 是任务详情对象
  public tasks = reactive<Map<string, Task>>(new Map());

  constructor() {
    // 连接后端的 WebSocket 服务
    // 请确保这里的地址 (http://localhost:3000) 和路径 (/socket.io) 与您的 NestJS 后端配置一致
    this.socket = io('http://localhost:3000', {
      path: '/socket.io',
      transports: ['websocket'], // 强制使用 WebSocket 协议
    });

    this.registerEventListeners();
  }

  // 统一注册所有事件监听器
  private registerEventListeners() {
    this.socket.on('connect', () => {
      console.log('✅ WebSocket 已连接');
      this.state.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket 已断开');
      this.state.isConnected = false;
    });

    this.socket.on('welcome', (data: { message: string }) => {
      console.log(`👋 来自服务器的消息: ${data.message}`);
    });

    // 核心：监听任务状态更新事件
    this.socket.on('task-update', (data: Task) => {
      console.log('🔄 收到任务状态更新:', data);
      this.tasks.set(data.taskId, data); // 使用 set 会自动处理新增和更新
    });

    // 核心：监听下载进度事件
    this.socket.on('download-progress', (data: { taskId: string; progress: number }) => {
      const task = this.tasks.get(data.taskId);
      if (task) {
        task.progress = data.progress;
        // 确保状态为 downloading，避免覆盖已完成的状态
        if (task.status !== 'completed' && task.status !== 'failed') {
            task.status = 'downloading';
        }
      }
    });
  }
}

// 导出一个单例，确保整个应用中只有一个 SocketService 实例
export const socketService = new SocketService();
