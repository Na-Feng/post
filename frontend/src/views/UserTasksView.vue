<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { userService } from '../services/user.service';
import type { UserAccountDto, CreateUserAccountDto, UpdateUserAccountDto } from '../types/user.dto';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Plus, Edit, Delete } from '@element-plus/icons-vue';

// --- 响应式状态 ---
const users = ref<UserAccountDto[]>([]);
const isLoading = ref(true);
const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref<FormInstance>();

// 当前正在编辑或创建的用户对象
const currentUser = ref<Partial<UserAccountDto>>({});

// 表单校验规则
const rules = ref<FormRules>({
  nickName: [{ required: true, message: '昵称不能为空', trigger: 'blur' }],
  douyinSecId: [{ required: true, message: '抖音 Sec ID 不能为空', trigger: 'blur' }],
  googleAccount: [{ required: true, message: 'Google 账户不能为空', trigger: 'blur' }],
  youtubeApiKey: [{ required: true, message: 'YouTube API Key 不能为空', trigger: 'blur' }],
});

// --- 数据获取 ---
onMounted(() => {
  fetchUsers();
});

async function fetchUsers() {
  isLoading.value = true;
  try {
    users.value = await userService.getUsers();
  } catch (error: any) {
    ElMessage.error(`获取用户列表失败: ${error.message}`);
  } finally {
    isLoading.value = false;
  }
}

// --- 事件处理 ---

function handleAddNew() {
  isEdit.value = false;
  currentUser.value = {
    nickName: '',
    douyinSecId: '',
    googleAccount: '',
    youtubeApiKey: '',
  };
  dialogVisible.value = true;
}

function handleEdit(user: UserAccountDto) {
  isEdit.value = true;
  currentUser.value = { ...user };
  dialogVisible.value = true;
}

async function handleDelete(user: UserAccountDto) {
  try {
    await ElMessageBox.confirm(`确定要删除用户 "${user.nickName}" 吗？此操作不可恢复。`, '警告', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await userService.deleteUser(user.douyinSecId);
    ElMessage.success('用户已删除');
    fetchUsers(); // 重新加载列表
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(`删除失败: ${error.message}`);
    }
  }
}

async function handleSubmit() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value) {
          // 更新用户
          await userService.updateUser(currentUser.value.douyinSecId!, currentUser.value as UpdateUserAccountDto);
          ElMessage.success('用户更新成功');
        } else {
          // 创建用户
          await userService.createUser(currentUser.value as CreateUserAccountDto);
          ElMessage.success('用户创建成功');
        }
        dialogVisible.value = false;
        fetchUsers(); // 重新加载列表
      } catch (error: any) {
        ElMessage.error(`操作失败: ${error.message}`);
      }
    }
  });
}

function handleDialogClose() {
  if (formRef.value) {
    formRef.value.resetFields();
  }
}

</script>

<template>
  <el-card shadow="always" body-class="!bg-gray-800/50">
    <template #header>
      <div class="flex justify-between items-center">
        <span class="text-xl font-semibold text-gray-200">用户管理</span>
        <el-button type="primary" :icon="Plus" @click="handleAddNew">新增用户</el-button>
      </div>
    </template>

    <el-table :data="users" v-loading="isLoading" stripe table-layout="auto">
      <el-table-column prop="nickName" label="昵称" />
      <el-table-column prop="douyinSecId" label="抖音 Sec ID" header-align="center" />
      <el-table-column prop="googleAccount" label="Google 账户" align="center" />
      <el-table-column label="操作" width="180" align="center">
        <template #default="scope">
          <el-button size="small" type="primary" :icon="Edit" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" :icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑用户对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑用户' : '新增用户'" 
      width="50%" 
      @closed="handleDialogClose"
      draggable
    >
      <el-form :model="currentUser" :rules="rules" ref="formRef" label-width="140px">
        <el-form-item label="用户昵称" prop="nickName">
          <el-input v-model="currentUser.nickName" placeholder="例如：官方新闻"></el-input>
        </el-form-item>
        <el-form-item label="抖音 Sec User ID" prop="douyinSecId">
          <el-input v-model="currentUser.douyinSecId" :disabled="isEdit" placeholder="用户的唯一标识"></el-input>
        </el-form-item>
        <el-form-item label="Google 账户" prop="googleAccount">
          <el-input v-model="currentUser.googleAccount" placeholder="用于上传 YouTube 的 Google 邮箱"></el-input>
        </el-form-item>
        <el-form-item label="YouTube API Key" prop="youtubeApiKey">
          <el-input v-model="currentUser.youtubeApiKey" type="textarea" placeholder="用于上传的 API 凭证"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </el-card>
</template>

<style>
.el-table, .el-table__expanded-cell {
    background-color: transparent;
}
.el-table th, .el-table tr {
    background-color: transparent;
}
.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell {
    background-color: #ffffff10;
}
.el-table td.el-table__cell, .el-table th.el-table__cell.is-leaf {
    border-bottom: 1px solid #ffffff20;
}
.el-dialog {
  background-color: #2d3748; /* bg-gray-700 */
}
</style>
