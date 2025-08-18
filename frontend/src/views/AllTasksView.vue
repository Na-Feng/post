<script setup lang="ts">
import { ref } from 'vue';
import { Task } from '../services/socket.service';
import TaskList from '../components/TaskList.vue';
import { Search } from '@element-plus/icons-vue';

const secUserId = ref('MS4wLjABAAAANpS3_2n1GAlMM2gVGGQc2CUEvCS_2GTTbertrH5sK2I');
const userTasks = ref<Task[]>([]);
const isLoading = ref(false);
const apiError = ref<string | null>(null);

const fetchUserTasks = async () => {
  if (!secUserId.value) {
    apiError.value = '请输入用户 sec_user_id';
    return;
  }
  isLoading.value = true;
  apiError.value = null;
  userTasks.value = [];

  try {
    const response = await fetch(`http://localhost:3000/tasks/${secUserId.value}`);
    if (!response.ok) throw new Error(`API 请求失败: ${response.statusText}`);
    userTasks.value = await response.json();
  } catch (e: any) {
    apiError.value = e.message;
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <el-card shadow="always" body-class="!bg-gray-800/50">
    <template #header>
      <div class="text-xl font-semibold text-gray-200">按用户筛选任务</div>
    </template>
    <div class="flex flex-col space-y-4">
      <el-input
        v-model="secUserId"
        placeholder="输入 sec_user_id"
        size="large"
        clearable
        :prefix-icon="Search"
      />
      <el-button
        @click="fetchUserTasks"
        :loading="isLoading"
        type="primary"
        size="large"
        class="w-full"
      >
        {{ isLoading ? '查询中...' : '查询' }}
      </el-button>
    </div>
    
    <el-alert v-if="apiError" :title="apiError" type="error" class="mt-4" show-icon :closable="false" />

    <div class="mt-6 h-[65vh] overflow-y-auto pr-2">
      <el-skeleton :rows="5" animated v-if="isLoading" />
      <TaskList v-else-if="userTasks.length > 0" :tasks="userTasks" />
      <el-empty v-else description="暂无查询结果" />
    </div>
  </el-card>
</template>