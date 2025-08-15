<template>
  <div class="flex flex-col items-center p-8 bg-gray-800 min-h-screen text-white">
    <h1 class="text-4xl font-bold mb-8">任务实时进度</h1>

    <div
      :class="[
        'px-4 py-2 rounded-lg font-bold mb-8',
        isConnected ? 'bg-green-500' : 'bg-red-500',
      ]"
    >
      {{ isConnected ? '已连接到服务器' : '已断开连接' }}
    </div>

    <TaskList :tasks="sortedTasks" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import TaskList from './components/TaskList.vue';
import type { Task } from './types';

const tasks = ref<Record<string, Task>>({});
const isConnected = ref(false);

// Sort tasks by ID so the list is stable
const sortedTasks = computed(() => {
  return Object.values(tasks.value).sort((a, b) => parseInt(a.id) - parseInt(b.id));
});

const API_URL = 'http://localhost:3000';

onMounted(async () => {
  // 1. Fetch initial tasks
  try {
    const response = await axios.get<Task[]>(`${API_URL}/tasks`);
    response.data.forEach(task => {
      tasks.value[task.id] = task;
    });
  } catch (error) {
    console.error('Failed to fetch initial tasks:', error);
  }

  // 2. Connect to WebSocket
  const socket: Socket = io(API_URL);

  socket.on('connect', () => {
    console.log('Connected to WebSocket server!');
    isConnected.value = true;
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket server.');
    isConnected.value = false;
  });

  socket.on('taskStatusUpdate', (data: { jobId: string; status: Task['status']; [key: string]: any }) => {
    console.log('Task Status Update:', data);
    const { jobId, status } = data;
    if (tasks.value[jobId]) {
      tasks.value[jobId].status = status;
    } else {
      tasks.value[jobId] = { 
        id: jobId, 
        status, 
        progress: status === 'completed' || status === 'skipped' ? 100 : 0,
        douyinId: data.douyinId || 'N/A',
      };
    }
  });

  socket.on('progressUpdate', (data: { jobId: string; progress: number }) => {
    console.log('Progress Update:', data);
    const { jobId, progress } = data;
    if (tasks.value[jobId]) {
      tasks.value[jobId].progress = progress;
    }
  });
});
</script>

<style scoped>
/* No custom styles needed, relying on Tailwind */
</style>