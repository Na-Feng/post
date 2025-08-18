<script setup lang="ts">
import { PropType } from 'vue';
import { Task } from '../services/socket.service';
import TaskItem from './TaskItem.vue';

// 定义 props，接收一个任务数组
defineProps({
  tasks: {
    type: Array as PropType<Task[]>,
    required: true,
  },
});
</script>

<template>
  <div class="space-y-4">
    <TaskItem v-for="task in tasks" :key="task.taskId" :task="task" />
  </div>
</template>