<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { userService } from '../services/user.service'; // Assuming userService can handle this

const route = useRoute();
const message = ref('正在处理授权...');
const isSuccess = ref(false);

onMounted(async () => {
  const code = route.query.code as string;
  const douyinSecId = route.query.state as string; // Assuming 'state' contains douyinSecId

  if (code && douyinSecId) {
    try {
      // Call backend to handle token exchange and save refresh token
      // This endpoint needs to be created in the backend (e.g., in user.controller.ts or a new oauth.controller.ts)
      await userService.handleGoogleOAuthCallback({ code, douyinSecId }); // Assuming this method exists in userService
      message.value = 'Google 授权成功！请关闭此窗口。 ';
      isSuccess.value = true;
      ElMessage.success('Google 授权成功！');

      // Optional: Automatically close the window after a short delay
      setTimeout(() => {
        window.close();
      }, 2000);
    } catch (error: any) {
      message.value = `Google 授权失败: ${error.message}`;
      isSuccess.value = false;
      ElMessage.error(`Google 授权失败: ${error.message}`);
    }
  } else {
    message.value = '授权参数缺失。';
    isSuccess.value = false;
    ElMessage.error('授权参数缺失。');
  }
});
</script>

<template>
  <div class="oauth-callback-container">
    <el-card :class="{ 'success-card': isSuccess, 'error-card': !isSuccess }">
      <div class="card-content">
        <i :class="isSuccess ? 'el-icon-success' : 'el-icon-error'"></i>
        <p>{{ message }}</p>
        <el-button v-if="!isSuccess" @click="window.close()">关闭</el-button>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.oauth-callback-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
}

.el-card {
  width: 400px;
  text-align: center;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.success-card {
  border-color: #67c23a;
}

.error-card {
  border-color: #f56c6c;
}

.card-content i {
  font-size: 48px;
  margin-bottom: 20px;
}

.success-card .el-icon-success {
  color: #67c23a;
}

.error-card .el-icon-error {
  color: #f56c6c;
}

.card-content p {
  font-size: 18px;
  margin-bottom: 20px;
  color: #303133;
}
</style>
