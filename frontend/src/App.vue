<script setup lang="ts">
import { ref, computed } from 'vue';
import { socketService, Task } from './services/socket.service';
import TaskList from './components/TaskList.vue';
import { Connection, Search, VideoCamera } from '@element-plus/icons-vue';

// --- 响应式状态 ---
const isConnected = computed(() => socketService.state.isConnected);
const allTasks = computed(() => {
  return Array.from(socketService.tasks.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
});

const secUserId = ref('MS4wLjABAAAANpS3_2n1GAlMM2gVGGQc2CUEvCS_2GTTbertrH5sK2I');
const userTasks = ref<Task[]>([]);
const isLoading = ref(false);
const apiError = ref<string | null>(null);

// --- 方法 ---
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
  <el-container class="bg-gray-900 min-h-screen text-white font-sans">
    <!-- 头部 -->
    <el-header class="flex justify-between items-center p-6 border-b border-gray-700">
      <div class="flex items-center">
        <el-icon :size="32" class="mr-3 text-cyan-400"><VideoCamera /></el-icon>
        <h1 class="text-2xl font-bold text-cyan-400">Dragonfly 监控系统</h1>
      </div>
      <el-tag :type="isConnected ? 'success' : 'danger'" effect="dark" round>
        <el-icon class="mr-1"><Connection /></el-icon>
        {{ isConnected ? '已连接' : '未连接' }}
      </el-tag>
    </el-header>

    <!-- 主内容区 -->
    <el-main class="p-4 md:p-8">
      <el-row :gutter="20">
        
        <!-- 左侧：实时任务 -->
        <el-col :xs="24" :lg="12" class="mb-4 lg:mb-0">
          <el-card shadow="always" body-class="!bg-gray-800/50">
            <template #header>
              <div class="text-xl font-semibold text-gray-200">实时任务动态</div>
            </template>
            <div class="h-[75vh] overflow-y-auto pr-2">
              <TaskList v-if="allTasks.length > 0" :tasks="allTasks" />
              <el-empty v-else description="暂无实时任务..." />
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：用户查询 -->
        <el-col :xs="24" :lg="12">
          <el-card shadow="always" body-class="!bg-gray-800/50">
            <template #header>
              <div class="text-xl font-semibold text-gray-200">查询用户任务列表</div>
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

            <div class="mt-6 h-[60vh] overflow-y-auto pr-2">
              <el-skeleton :rows="5" animated v-if="isLoading" />
              <TaskList v-else-if="userTasks.length > 0" :tasks="userTasks" />
              <el-empty v-else description="暂无查询结果" />
            </div>
          </el-card>
        </el-col>

      </el-row>
    </el-main>
  </el-container>
</template>

<style>
/* 自定义 Element Plus 卡片头部和主体的背景色 */
.el-card__header, .el-card__body {
  background-color: #1f2937; /* bg-gray-800 */
  border-color: #374151; /* border-gray-700 */
}
</style>
