<template>
  <el-card class="mb-4" :class="`status-${task.status}`">
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center space-x-4">
        <span class="font-mono text-sm text-gray-500">Job #{{ task.id }}</span>
        <span class="font-bold text-lg">Douyin ID: {{ task.douyinId }}</span>
      </div>
      <el-tag :type="statusType" effect="dark" size="large">{{ task.status }}</el-tag>
    </div>

    <el-progress :percentage="task.progress" :status="progressStatus" :stroke-width="18" text-inside />

    <div v-if="task.error" class="mt-2 text-red-500 text-sm font-mono">
      Error: {{ task.error }}
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Task } from '../types';
import { ElCard, ElProgress, ElTag } from 'element-plus'; // Explicitly import components

const props = defineProps<{
  task: Task;
}>();

const statusType = computed(() => {
  switch (props.task.status) {
    case 'completed':
      return 'success';
    case 'failed':
      return 'danger';
    case 'skipped':
      return 'info';
    default:
      return ''; // Default for 'processing'
  }
});

const progressStatus = computed(() => {
  if (props.task.status === 'completed') return 'success';
  if (props.task.status === 'failed') return 'exception';
  return ''; // Default for 'processing' or 'skipped'
});
</script>

<style scoped>
/* Custom styling for status colors if needed, or rely purely on Element Plus types */
.status-failed {
  border-left: 5px solid #f56c6c; /* Element Plus danger color */
}
.status-completed {
  border-left: 5px solid #67c23a; /* Element Plus success color */
}
.status-skipped {
  border-left: 5px solid #909399; /* Element Plus info color */
}
</style>
