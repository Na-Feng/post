<script setup lang="ts">
import { computed } from 'vue';
import { socketService } from '../services/socket.service';
import TaskList from '../components/TaskList.vue';

const allTasks = computed(() => {
  return Array.from(socketService.tasks.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
});
</script>

<template>
  <el-card shadow="always" body-class="!bg-gray-800/50">
    <template #header>
      <div class="text-xl font-semibold text-gray-200">实时任务动态</div>
    </template>
    <div class="h-[80vh] overflow-y-auto pr-2">
      <TaskList v-if="allTasks.length > 0" :tasks="allTasks" />
      <el-empty v-else description="暂无实时任务..." />
    </div>
  </el-card>
</template>
