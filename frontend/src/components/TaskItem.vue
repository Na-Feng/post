<script setup lang="ts">
import { PropType, computed } from 'vue';
import { Task } from '../services/socket.service';
import { CircleCheck, CircleClose, Loading, Document } from '@element-plus/icons-vue';

const props = defineProps({
  task: {
    type: Object as PropType<Task>,
    required: true,
  },
});

// --- 计算属性 ---

// 根据任务状态，返回对应的 Element Plus 标签类型 (primary, success, danger, info)
const statusTagType = computed(() => {
  switch (props.task.status) {
    case 'downloading': return 'primary';
    case 'completed': return 'success';
    case 'failed': return 'danger';
    default: return 'info';
  }
});

// 根据任务状态，返回对应的 Element Plus 图标
const statusIcon = computed(() => {
  switch (props.task.status) {
    case 'downloading': return Loading;
    case 'completed': return CircleCheck;
    case 'failed': return CircleClose;
    default: return null;
  }
});

// 根据任务状态，返回对应的 Element Plus 进度条状态
const progressStatus = computed(() => {
  if (props.task.status === 'failed') return 'exception';
  if (props.task.status === 'completed') return 'success';
  return ''; // 默认蓝色
});

// 格式化日期，如果日期无效则返回 'N/A'
const formattedDate = computed(() => {
  try {
    return new Date(props.task.createdAt).toLocaleString();
  } catch {
    return 'N/A';
  }
});
</script>

<template>
  <el-card shadow="hover" body-class="!p-4 !bg-gray-800/60">
    <div class="flex flex-col space-y-3">
      
      <!-- 任务标题 -->
      <p class="font-semibold text-gray-200 truncate" :title="task.title">
        <el-icon class="mr-2 align-middle"><Document /></el-icon>
        {{ task.title || 'N/A' }}
      </p>

      <!-- 进度条 -->
      <el-progress
        :percentage="task.progress"
        :status="progressStatus"
        :stroke-width="10"
        striped
        striped-flow
        :duration="10"
      />

      <!-- 底部信息行 -->
      <div class="flex justify-between items-center text-xs text-gray-400 pt-1">
        <!-- 状态标签 -->
        <el-tag :type="statusTagType" size="small" effect="dark">
          <el-icon v-if="statusIcon" :class="{ 'is-loading': task.status === 'downloading' }" class="mr-1">
            <component :is="statusIcon" />
          </el-icon>
          {{ task.status }}
        </el-tag>
        <!-- 创建时间 -->
        <span class="font-mono">{{ formattedDate }}</span>
      </div>

      <!-- 状态消息 -->
      <div v-if="task.message" class="text-xs text-gray-500 bg-gray-900/50 p-2 rounded mt-1 font-mono">
        <p class="break-all">> {{ task.message }}</p>
      </div>

    </div>
  </el-card>
</template>
