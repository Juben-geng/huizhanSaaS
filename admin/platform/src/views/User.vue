<template>
  <div class="user">
    <el-card v-sound:hover>
      <template #header>
        <div class="card-header">
          <span>{{ t('user.title') }}</span>
          <el-button type="primary" @click="showCreateDialog" v-sound:click>{{ t('user.addUser') }}</el-button>
        </div>
      </template>

      <el-form :inline="true" class="search-form">
        <el-form-item :label="t('common.search')">
          <el-input v-model="searchForm.keyword" :placeholder="t('user.username') + '/' + t('user.phone') + '/' + t('user.email')" clearable v-sound:focus />
        </el-form-item>
        <el-form-item :label="t('user.role')">
          <el-select v-model="searchForm.type" :placeholder="t('user.role')" clearable v-sound:focus>
            <el-option label="平台管理员" value="platform" v-sound:hover />
            <el-option label="主办方" value="organizer" v-sound:hover />
            <el-option label="商家" value="merchant" v-sound:hover />
            <el-option label="访客" value="visitor" v-sound:hover />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('common.status')">
          <el-select v-model="searchForm.status" :placeholder="t('common.status')" clearable v-sound:focus>
            <el-option label="正常" value="active" v-sound:hover />
            <el-option label="禁用" value="inactive" v-sound:hover />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" v-sound:click>{{ t('common.search') }}</el-button>
          <el-button @click="handleReset" v-sound:click>{{ t('common.reset') }}</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" stripe v-loading="loading" v-sound:hover>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" :label="t('user.username')" width="120" />
        <el-table-column prop="name" :label="t('common.remark')" width="100" />
        <el-table-column prop="phone" :label="t('user.phone')" width="130" />
        <el-table-column prop="email" :label="t('user.email')" min-width="150" />
        <el-table-column prop="type" :label="t('user.role')" width="100">
          <template #default="{ row }">
            <el-tag :type="getUserTypeColor(row.type)">{{ getUserTypeName(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="organization" :label="t('user.role')" width="120" />
        <el-table-column prop="registerTime" :label="t('user.registerTime')" width="120">
          <template #default="{ row }">
            {{ formatDateTime(row.registerTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginTime" :label="t('user.lastLoginTime')" width="120">
          <template #default="{ row }">
            {{ formatDateTime(row.lastLoginTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="loginWeeklyCount" :label="t('user.loginWeeklyCount')" width="100" />
        <el-table-column prop="loginDuration" :label="t('user.loginDuration')" width="100">
          <template #default="{ row }">
            {{ formatDuration(row.loginDuration) }}
          </template>
        </el-table-column>
        <el-table-column prop="daysNotLogin" :label="t('user.daysNotLogin')" width="100">
          <template #default="{ row }">
            {{ row.daysNotLogin || 0 }} 天
          </template>
        </el-table-column>
        <el-table-column prop="status" :label="t('common.status')" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.operation')" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)" v-sound:click>{{ t('common.edit') }}</el-button>
            <el-button link type="warning" @click="handleToggleStatus(row)" v-sound:click>
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="danger" @click="handleDelete(row)" v-sound:click>{{ t('common.delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="resetForm"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item :label="t('user.username')" prop="username">
          <el-input v-model="form.username" :placeholder="t('user.username')" maxlength="50" v-sound:focus />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" maxlength="50" v-sound:focus />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="20" v-sound:focus />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" maxlength="100" v-sound:focus />
        </el-form-item>
        <el-form-item label="用户类型" prop="type">
          <el-select v-model="form.type" placeholder="选择用户类型" style="width: 100%" :disabled="!!form.id" v-sound:focus>
            <el-option label="平台管理员" value="platform" v-sound:hover />
            <el-option label="主办方" value="organizer" v-sound:hover />
            <el-option label="商家" value="merchant" v-sound:hover />
            <el-option label="访客" value="visitor" v-sound:hover />
          </el-select>
        </el-form-item>
        <el-form-item label="所属组织" prop="organizationId" v-if="form.type !== 'platform'">
          <el-input v-model="form.organization" placeholder="所属组织" disabled />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!form.id">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password v-sound:focus />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="选择角色" style="width: 100%" v-sound:focus>
            <el-option label="超级管理员" value="super" v-sound:hover />
            <el-option label="管理员" value="admin" v-sound:hover />
            <el-option label="普通用户" value="user" v-sound:hover />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="form.status" :active-value="'active'" :inactive-value="'inactive'" v-sound:click />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false" v-sound:click>取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting" v-sound:click>确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '../utils/request';
import dayjs from 'dayjs';

const { t } = useI18n();

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const formRef = ref(null);
const tableData = ref([]);

const searchForm = reactive({
  keyword: '',
  type: '',
  status: ''
});

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});

const form = reactive({
  id: null,
  username: '',
  name: '',
  phone: '',
  email: '',
  type: '',
  organizationId: null,
  organization: '',
  password: '',
  role: 'user',
  status: 'active'
});

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  type: [{ required: true, message: '请选择用户类型', trigger: 'change' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ]
};

const dialogTitle = computed(() => (form.id ? '编辑用户' : '添加用户'));

onMounted(() => {
  loadData();
});

async function loadData() {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    };
    const data = await request.get('/platform/users', params);
    tableData.value = data.list;
    pagination.total = data.total;
  } catch (error) {
    console.error('Load users error:', error);
    ElMessage.error('加载数据失败');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.page = 1;
  loadData();
}

function handleReset() {
  searchForm.keyword = '';
  searchForm.type = '';
  searchForm.status = '';
  pagination.page = 1;
  loadData();
}

function showCreateDialog() {
  dialogVisible.value = true;
}

function handleEdit(row) {
  Object.assign(form, {
    id: row.id,
    username: row.username,
    name: row.name,
    phone: row.phone,
    email: row.email,
    type: row.type,
    organizationId: row.organizationId,
    organization: row.organization,
    password: '',
    role: row.role,
    status: row.status
  });
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    submitting.value = true;
    try {
      const data = {
        username: form.username,
        name: form.name,
        phone: form.phone,
        email: form.email,
        type: form.type,
        organizationId: form.organizationId,
        role: form.role,
        status: form.status
      };

      if (form.password) {
        data.password = form.password;
      }

      if (form.id) {
        await request.put(`/platform/users/${form.id}`, data);
        ElMessage.success('更新成功');
      } else {
        await request.post('/platform/users', data);
        ElMessage.success('创建成功');
      }

      dialogVisible.value = false;
      loadData();
    } catch (error) {
      console.error('Submit user error:', error);
      ElMessage.error('操作失败');
    } finally {
      submitting.value = false;
    }
  });
}

function resetForm() {
  formRef.value?.resetFields();
  form.id = null;
  form.organizationId = null;
  form.organization = '';
}

async function handleToggleStatus(row) {
  const action = row.status === 'active' ? '禁用' : '启用';
  try {
    await ElMessageBox.confirm(`确定要${action}该用户吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    await request.put(`/platform/users/${row.id}/status`, {
      status: row.status === 'active' ? 'inactive' : 'active'
    });

    ElMessage.success(`${action}成功`);
    loadData();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Toggle status error:', error);
      ElMessage.error('操作失败');
    }
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定要删除该用户吗？删除后无法恢复！', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    await request.delete(`/platform/users/${row.id}`);
    ElMessage.success('删除成功');
    loadData();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete user error:', error);
      ElMessage.error('删除失败');
    }
  }
}

function formatDateTime(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
}

function formatDuration(minutes) {
  if (!minutes || minutes < 0) return '0 小时';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} 分钟`;
  if (mins === 0) return `${hours} 小时`;
  return `${hours} 小时 ${mins} 分钟`;
}

function getUserTypeColor(type) {
  const map = {
    platform: 'danger',
    organizer: 'warning',
    merchant: 'success',
    visitor: ''
  };
  return map[type] || '';
}

function getUserTypeName(type) {
  const map = {
    platform: '平台管理员',
    organizer: '主办方',
    merchant: '商家',
    visitor: '访客'
  };
  return map[type] || type;
}
</script>

<style scoped lang="scss">
.user {
  .search-form {
    margin-bottom: 20px;
  }
}
</style>
