<template>
  <div class="organizer">
    <el-card v-sound:hover>
      <template #header>
        <div class="card-header">
          <span>主办方管理</span>
          <el-button type="primary" @click="showCreateDialog" v-sound:click>添加主办方</el-button>
        </div>
      </template>

      <el-form :inline="true" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="名称/联系人/手机号" clearable v-sound:focus />
        </el-form-item>
        <el-form-item label="套餐">
          <el-select v-model="searchForm.package" placeholder="选择套餐" clearable v-sound:focus>
            <el-option label="免费版" value="free" v-sound:hover />
            <el-option label="专业版" value="professional" v-sound:hover />
            <el-option label="企业版" value="enterprise" v-sound:hover />
            <el-option label="旗舰版" value="flagship" v-sound:hover />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="选择状态" clearable v-sound:focus>
            <el-option label="正常" value="active" v-sound:hover />
            <el-option label="禁用" value="inactive" v-sound:hover />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" v-sound:click>搜索</el-button>
          <el-button @click="handleReset" v-sound:click>重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" stripe v-loading="loading" v-sound:hover>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="主办方名称" min-width="150" />
        <el-table-column prop="contactName" label="联系人" width="100" />
        <el-table-column prop="contactPhone" label="联系电话" width="130" />
        <el-table-column prop="package" label="套餐" width="100">
          <template #default="{ row }">
            <el-tag :type="getPackageType(row.package)">{{ getPackageName(row.package) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="expireTime" label="到期时间" width="120">
          <template #default="{ row }">
            {{ formatDate(row.expireTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="username" label="登录用户名" width="120" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="120">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)" v-sound:click>查看</el-button>
            <el-button link type="primary" @click="handleEdit(row)" v-sound:click>编辑</el-button>
            <el-button link type="warning" @click="handleToggleStatus(row)" v-sound:click>
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="danger" @click="handleDelete(row)" v-sound:click>删除</el-button>
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
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="主办方名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入主办方名称" maxlength="100" v-sound:focus />
        </el-form-item>
        <el-form-item label="登录用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入登录用户名" maxlength="50" :disabled="!!form.id" v-sound:focus />
        </el-form-item>
        <el-form-item :label="form.id ? '新密码' : '密码'" prop="password">
          <el-input 
            v-model="form.password" 
            type="password" 
            :placeholder="form.id ? '不修改请留空' : '请输入密码'" 
            maxlength="20"
            show-password
            v-sound:focus 
          />
        </el-form-item>
        <el-form-item label="联系人" prop="contactName">
          <el-input v-model="form.contactName" placeholder="请输入联系人姓名" maxlength="50" v-sound:focus />
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="form.contactPhone" placeholder="请输入联系电话" maxlength="20" v-sound:focus />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" maxlength="100" v-sound:focus />
        </el-form-item>
        <el-form-item label="套餐" prop="package">
          <el-select v-model="form.package" placeholder="选择套餐" style="width: 100%" v-sound:focus>
            <el-option label="免费版" value="free" v-sound:hover />
            <el-option label="专业版" value="professional" v-sound:hover />
            <el-option label="企业版" value="enterprise" v-sound:hover />
            <el-option label="旗舰版" value="flagship" v-sound:hover />
          </el-select>
        </el-form-item>
        <el-form-item label="角色" prop="roleId">
          <el-select v-model="form.roleId" placeholder="选择角色" style="width: 100%" clearable v-sound:focus>
            <el-option 
              v-for="role in roles" 
              :key="role.id" 
              :label="role.name" 
              :value="role.id"
              v-sound:hover 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="到期时间" prop="expireTime">
          <el-date-picker
            v-model="form.expireTime"
            type="date"
            placeholder="选择到期时间"
            style="width: 100%"
            v-sound:focus
          />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" placeholder="请输入地址" maxlength="200" v-sound:focus />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false" v-sound:click>取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting" v-sound:click>确定</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="主办方详情" width="700px">
      <el-descriptions :column="2" border v-if="currentOrganizer">
        <el-descriptions-item label="主办方名称">{{ currentOrganizer.name }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ currentOrganizer.contactName }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentOrganizer.contactPhone }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ currentOrganizer.email }}</el-descriptions-item>
        <el-descriptions-item label="套餐">
          <el-tag :type="getPackageType(currentOrganizer.package)">{{ getPackageName(currentOrganizer.package) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="到期时间">{{ formatDate(currentOrganizer.expireTime) }}</el-descriptions-item>
        <el-descriptions-item label="地址" :span="2">{{ currentOrganizer.address }}</el-descriptions-item>
        <el-descriptions-item label="展会数量">{{ currentOrganizer.exhibitionCount }}</el-descriptions-item>
        <el-descriptions-item label="商家数量">{{ currentOrganizer.merchantCount }}</el-descriptions-item>
        <el-descriptions-item label="访客数量">{{ currentOrganizer.visitorCount }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentOrganizer.status === 'active' ? 'success' : 'info'">
            {{ currentOrganizer.status === 'active' ? '正常' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ formatDate(currentOrganizer.createTime) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '../utils/request';
import dayjs from 'dayjs';

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const detailDialogVisible = ref(false);
const formRef = ref(null);
const tableData = ref([]);
const currentOrganizer = ref(null);

const searchForm = reactive({
  keyword: '',
  package: '',
  status: ''
});

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});

const form = reactive({
  id: null,
  name: '',
  username: '',
  password: '',
  contactName: '',
  contactPhone: '',
  email: '',
  package: '',
  expireTime: '',
  address: '',
  roleId: null
});

const roles = ref([]);

const rules = computed(() => ({
  name: [{ required: true, message: '请输入主办方名称', trigger: 'blur' }],
  username: form.id ? [] : [{ required: true, message: '请输入登录用户名', trigger: 'blur' }],
  password: form.id ? [] : [{ required: true, message: '请输入密码', trigger: 'blur' }],
  contactName: [{ required: true, message: '请输入联系人姓名', trigger: 'blur' }],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  package: [{ required: true, message: '请选择套餐', trigger: 'change' }],
  expireTime: [{ required: true, message: '请选择到期时间', trigger: 'change' }]
}));

const dialogTitle = computed(() => (form.id ? '编辑主办方' : '添加主办方'));

onMounted(() => {
  loadData();
  loadRoles();
});

async function loadRoles() {
  try {
    const data = await request.get('/platform/roles', { pageSize: 100 });
    roles.value = data.list;
  } catch (error) {
    console.error('Load roles error:', error);
  }
}

async function loadData() {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword,
      packageType: searchForm.package,
      status: searchForm.status
    };
    const data = await request.get('/platform/organizers', params);
    tableData.value = data.list;
    pagination.total = data.total;
  } catch (error) {
    console.error('Load organizers error:', error);
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
  searchForm.package = '';
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
    name: row.name,
    username: row.username || '',
    password: '',
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    email: row.email,
    package: row.package,
    expireTime: row.expireTime,
    address: row.address,
    roleId: row.roleId || null
  });
  dialogVisible.value = true;
}

function handleView(row) {
  currentOrganizer.value = row;
  detailDialogVisible.value = true;
}

async function handleSubmit() {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    submitting.value = true;
    try {
      const data = {
        name: form.name,
        username: form.username,
        password: form.password,
        contactName: form.contactName,
        contactPhone: form.contactPhone,
        email: form.email,
        package: form.package,
        expireTime: form.expireTime,
        address: form.address,
        roleId: form.roleId
      };

      if (form.id) {
        await request.put(`/platform/organizers/${form.id}`, data);
        ElMessage.success('更新成功');
      } else {
        await request.post('/platform/organizers', data);
        ElMessage.success('创建成功');
      }

      dialogVisible.value = false;
      loadData();
    } catch (error) {
      console.error('Submit organizer error:', error);
      ElMessage.error('操作失败');
    } finally {
      submitting.value = false;
    }
  });
}

function resetForm() {
  formRef.value?.resetFields();
  form.id = null;
}

async function handleToggleStatus(row) {
  const action = row.status === 'active' ? '禁用' : '启用';
  try {
    await ElMessageBox.confirm(`确定要${action}该主办方吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    await request.put(`/platform/organizers/${row.id}/status`, {
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
    await ElMessageBox.confirm('确定要删除该主办方吗？删除后无法恢复！', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    await request.delete(`/platform/organizers/${row.id}`);
    ElMessage.success('删除成功');
    loadData();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete organizer error:', error);
      ElMessage.error('删除失败');
    }
  }
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD');
}

function getPackageType(pkg) {
  const map = {
    free: '',
    professional: 'warning',
    enterprise: 'success',
    flagship: 'danger'
  };
  return map[pkg] || '';
}

function getPackageName(pkg) {
  const map = {
    free: '免费版',
    professional: '专业版',
    enterprise: '企业版',
    flagship: '旗舰版'
  };
  return map[pkg] || pkg;
}
</script>

<style scoped lang="scss">
.organizer {
  .search-form {
    margin-bottom: 20px;
  }
}
</style>
