<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { socketService } from './services/socket.service';
import { Connection, VideoCamera, User, Tickets, House } from '@element-plus/icons-vue';

const isConnected = computed(() => socketService.state.isConnected);
const route = useRoute();
</script>

<template>
  <el-container class="bg-gray-900 min-h-screen text-gray-200 font-sans">
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

    <el-container>
      <!-- 侧边栏 -->
      <el-aside width="240px" class="bg-gray-800/50 p-4">
        <el-menu
          :default-active="route.path"
          active-text-color="#4fd1c5"
          background-color="#1f2937"
          class="el-menu-vertical-demo"
          text-color="#E5E7EB"
          router
        >
          <el-menu-item index="/">
            <el-icon><House /></el-icon>
            <span>实时任务</span>
          </el-menu-item>
          <el-menu-item index="/users">
            <el-icon><User /></el-icon>
            <span>用户列表</span>
          </el-menu-item>
          <el-menu-item index="/tasks">
            <el-icon><Tickets /></el-icon>
            <span>用户任务查询</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区 -->
      <el-main class="p-4 md:p-8">
        <router-view v-slot="{ Component }">
          <template v-if="Component">
            <transition name="el-fade-in-linear" mode="out-in">
              <component :is="Component" />
            </transition>
          </template>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<style>
/* 自定义 Element Plus 卡片头部和主体的背景色 */
.el-card__header, .el-card__body {
  background-color: #1f2937; /* bg-gray-800 */
  border-color: #374151; /* border-gray-700 */
}

.el-menu {
  border-right: none;
}

.el-menu-item.is-active {
    background-color: #0e7490 !important; /* cyan-700 for active item */
}
</style>
