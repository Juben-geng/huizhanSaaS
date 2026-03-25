<template>
  <div class="role-container">
    <el-card class="header-card" v-sound:hover>
      <div class="header-content">
        <h2>角色权限管理</h2>
        <el-button type="primary" @click="handleCreate" v-sound:click>创建角色</el-button>
      </div>
    </el-card>

    <el-card class="content-card" v-sound:hover>
      <el-form :inline="true" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchKeyword" placeholder="角色名称/标识" clearable @clear="fetchRoles" v-sound:focus />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchRoles" v-sound:click>搜索</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="roles" stripe border v-sound:hover>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="roleKey" label="角色标识" width="150" />
        <el-table-column prop="name" label="角色名称" width="150" />
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="权限数量" width="120">
          <template #default="{ row }">
            {{ row.permissions.length }} 个
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)" v-sound:click>编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)" v-sound:click>删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchRoles"
        @current-change="fetchRoles"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px">
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="角色标识" prop="roleKey">
          <el-input v-model="formData.roleKey" placeholder="如: operator" :disabled="isEdit" v-sound:focus />
        </el-form-item>
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="formData.name" placeholder="如: 运营人员" v-sound:focus />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="3" v-sound:focus />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="formData.status" active-value="active" inactive-value="inactive" v-sound:click />
        </el-form-item>
        <el-form-item label="权限配置">
          <div class="permissions-config">
            <div v-for="group in permissionGroups" :key="group.group" class="permission-group">
              <el-checkbox
                v-model="group.checked"
                :indeterminate="group.indeterminate"
                @change="handleGroupCheck(group)"
                v-sound:click
              >
                {{ group.group }}
              </el-checkbox>
              <div class="permission-items">
                <el-checkbox
                  v-for="perm in group.permissions"
                  :key="perm.key"
                  v-model="perm.checked"
                  @change="handlePermissionCheck(group)"
                  v-sound:click
                >
                  {{ perm.name }}
                </el-checkbox>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false" v-sound:click>取消</el-button>
        <el-button type="primary" @click="handleSubmit" v-sound:click>确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const searchKeyword = ref('')
const dialogVisible = ref(false)
const dialogTitle = computed(() => isEdit.value ? '编辑角色' : '创建角色')
const isEdit = ref(false)
const formRef = ref(null)

const formData = reactive({
  id: null,
  roleKey: '',
  name: '',
  description: '',
  status: 'active',
  permissions: []
})

const formRules = {
  roleKey: [{ required: true, message: '角色标识不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '角色名称不能为空', trigger: 'blur' }]
}

const roles = ref([])
const permissionGroups = ref([])
const allPermissions = ref([])

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const fetchRoles = async () => {
  try {
    const res = await request.get('/platform/roles', {
      params: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        keyword: searchKeyword.value
      }
    })
    if (res.code === 200) {
      roles.value = res.data.list
      pagination.total = res.data.total
    }
  } catch (error) {
    ElMessage.error('获取角色列表失败')
  }
}

const fetchPermissions = async () => {
  try {
    const res = await request.get('/platform/permissions')
    if (res.code === 200) {
      allPermissions.value = []
      permissionGroups.value = res.data.map(group => ({
        group: group.group,
        checked: false,
        indeterminate: false,
        permissions: group.permissions.map(perm => ({
          ...perm,
          checked: false
        }))
      }))
      permissionGroups.value.forEach(group => {
        group.permissions.forEach(perm => {
          allPermissions.value.push(perm)
        })
      })
    }
  } catch (error) {
    ElMessage.error('获取权限列表失败')
  }
}

const handleGroupCheck = (group) => {
  group.permissions.forEach(perm => {
    perm.checked = group.checked
  })
  group.indeterminate = false
}

const handlePermissionCheck = (group) => {
  const allChecked = group.permissions.every(perm => perm.checked)
  const someChecked = group.permissions.some(perm => perm.checked)
  group.checked = allChecked
  group.indeterminate = someChecked && !allChecked
}

const handleCreate = () => {
  isEdit.value = false
  Object.assign(formData, {
    id: null,
    roleKey: '',
    name: '',
    description: '',
    status: 'active',
    permissions: []
  })
  permissionGroups.value.forEach(group => {
    group.checked = false
    group.indeterminate = false
    group.permissions.forEach(perm => {
      perm.checked = false
    })
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(formData, {
    id: row.id,
    roleKey: row.roleKey,
    name: row.name,
    description: row.description,
    status: row.status,
    permissions: [...row.permissions]
  })

  permissionGroups.value.forEach(group => {
    group.permissions.forEach(perm => {
      perm.checked = row.permissions.includes(perm.key)
    })
    handlePermissionCheck(group)
  })

  dialogVisible.value = true
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()

    const selectedPermissions = []
    permissionGroups.value.forEach(group => {
      group.permissions.forEach(perm => {
        if (perm.checked) {
          selectedPermissions.push(perm.key)
        }
      })
    })

    const data = {
      roleKey: formData.roleKey,
      name: formData.name,
      description: formData.description,
      status: formData.status,
      permissions: selectedPermissions
    }

    const res = isEdit.value
      ? await request.put(`/platform/roles/${formData.id}`, data)
      : await request.post('/platform/roles', data)

    if (res.code === 200) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      fetchRoles()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
    }
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该角色吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await request.delete(`/platform/roles/${row.id}`)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        fetchRoles()
      }
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

onMounted(() => {
  fetchRoles()
  fetchPermissions()
})
</script>

<style scoped>
.role-container {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.search-form {
  margin-bottom: 20px;
}

.el-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.permissions-config {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  padding: 10px;
  border-radius: 4px;
}

.permission-group {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.permission-group:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.permission-items {
  margin-left: 20px;
  padding-top: 10px;
}

.permission-items .el-checkbox {
  margin-right: 20px;
  margin-bottom: 8px;
}
</style>
