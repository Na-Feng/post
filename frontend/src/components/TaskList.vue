<template>
  <div class="flex flex-col gap-4 w-full max-w-3xl">
    <TaskItem v-for="task in tasks" :key="task.id" :task="task" />
  </div>
</template>

<script setup lang="ts">
import type { Task } from '../types';
import TaskItem from './TaskItem.vue';

defineProps<{
  tasks: Task[];
}>();
</script>

<style scoped>
/* No custom styles needed, relying on Tailwind */
</style>
