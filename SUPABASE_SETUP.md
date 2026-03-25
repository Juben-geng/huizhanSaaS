# Supabase 数据库集成指南

本项目已配置支持 Supabase PostgreSQL 数据库，用于生产环境部署。

## 为什么选择 Supabase？

- ✅ 完全开源的 PostgreSQL 数据库
- ✅ 免费套餐（500MB 数据库存储）
- ✅ 与 Vercel 完美集成
- ✅ 自动备份和实时功能
- ✅ 内置身份验证和存储

## 步骤 1: 创建 Supabase 项目

1. 访问 https://supabase.com
2. 点击 "Start your project"
3. 使用 GitHub 账号登录
4. 创建新项目：
   - **Name**: `huizhan-saas`（或您喜欢的名称）
   - **Database Password**: 设置一个强密码（请记住！）
   - **Region**: 选择离您的用户最近的区域（如 Northeast Asia (Tokyo)）
5. 等待项目创建完成（约 2 分钟）

## 步骤 2: 获取数据库连接信息

1. 进入项目仪表板
2. 点击左侧菜单的 **Settings** → **Database**
3. 复制 **Connection string** → **URI** 格式的连接字符串
4. 连接字符串格式类似：
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxx.supabase.co:5432/postgres
   ```

## 步骤 3: 配置环境变量

### 在 Vercel 中配置

1. 进入 Vercel 项目设置
2. 点击 **Settings** → **Environment Variables**
3. 添加以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DATABASE_URL` | 你的 Supabase 连接字符串 | PostgreSQL 数据库连接 |
| `NODE_ENV` | `production` | 生产环境标识 |
| `JWT_SECRET` | 设置一个安全的密钥 | JWT 令牌加密密钥 |

**重要**: 不要在代码中直接写入数据库密码！

### 在本地开发中配置（可选）

编辑 `backend/.env` 文件，替换 `DATABASE_URL`：

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxx.supabase.co:5432/postgres
```

## 步骤 4: 创建数据库表

由于 Supabase 是 PostgreSQL，我们需要手动创建表结构。有两种方式：

### 方式 1: 使用 Supabase SQL 编辑器（推荐）

1. 在 Supabase 仪表板，点击左侧菜单的 **SQL Editor**
2. 点击 **New query**
3. 复制并执行以下 SQL 脚本：

```sql
-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20),
  realName VARCHAR(50),
  avatar VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  lastLoginAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 商户表
CREATE TABLE IF NOT EXISTS merchants (
  id VARCHAR(36) PRIMARY KEY,
  merchantName VARCHAR(100) NOT NULL,
  contactName VARCHAR(50),
  contactPhone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  logo VARCHAR(255),
  businessLicense VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  subscriptionLevel VARCHAR(20) DEFAULT 'basic',
  subscriptionExpireAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 会展表
CREATE TABLE IF NOT EXISTS exhibitions (
  id VARCHAR(36) PRIMARY KEY,
  merchantId VARCHAR(36) NOT NULL,
  exhibitionName VARCHAR(200) NOT NULL,
  description TEXT,
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,
  location VARCHAR(200),
  coverImage VARCHAR(255),
  status VARCHAR(20) DEFAULT 'draft',
  maxVisitors INTEGER DEFAULT 1000,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (merchantId) REFERENCES merchants(id) ON DELETE CASCADE
);

-- 访客表
CREATE TABLE IF NOT EXISTS visitors (
  id VARCHAR(36) PRIMARY KEY,
  exhibitionId VARCHAR(36) NOT NULL,
  name VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  company VARCHAR(100),
  qrCode VARCHAR(255),
  checkInAt TIMESTAMP,
  checkOutAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exhibitionId) REFERENCES exhibitions(id) ON DELETE CASCADE
);

-- 虚拟房间表
CREATE TABLE IF NOT EXISTS virtual_rooms (
  id VARCHAR(36) PRIMARY KEY,
  exhibitionId VARCHAR(36) NOT NULL,
  roomName VARCHAR(100) NOT NULL,
  description TEXT,
  roomType VARCHAR(20) DEFAULT 'chat',
  maxParticipants INTEGER DEFAULT 100,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exhibitionId) REFERENCES exhibitions(id) ON DELETE CASCADE
);

-- 聊天记录表
CREATE TABLE IF NOT EXISTS chat_records (
  id VARCHAR(36) PRIMARY KEY,
  roomId VARCHAR(36) NOT NULL,
  userId VARCHAR(36),
  merchantId VARCHAR(36),
  messageType VARCHAR(20) DEFAULT 'text',
  content TEXT,
  fileUrl VARCHAR(255),
  senderType VARCHAR(20) DEFAULT 'user',
  status VARCHAR(20) DEFAULT 'sent',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (roomId) REFERENCES virtual_rooms(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_merchants_status ON merchants(status);
CREATE INDEX IF NOT EXISTS idx_exhibitions_merchantId ON exhibitions(merchantId);
CREATE INDEX IF NOT EXISTS idx_visitors_exhibitionId ON visitors(exhibitionId);
CREATE INDEX IF NOT EXISTS idx_virtual_rooms_exhibitionId ON virtual_rooms(exhibitionId);
CREATE INDEX IF NOT EXISTS idx_chat_records_roomId ON chat_records(roomId);
```

### 方式 2: 使用迁移工具（需要额外配置）

如果您想使用 Sequelize 迁移功能，需要安装迁移工具并配置迁移脚本。这需要更多配置工作，建议使用方式 1。

## 步骤 5: 测试连接

### 本地测试

```bash
cd backend
npm start
```

如果一切正常，您应该看到：
```
Database connected successfully
Server running on port 3001
```

### Vercel 部署测试

部署完成后，访问您的 Vercel 应用：
```
https://your-project.vercel.app
```

如果遇到数据库连接错误，检查：
1. `DATABASE_URL` 是否正确配置
2. Supabase 项目是否处于活跃状态
3. Supabase 连接池限制（免费套餐：60 个连接）

## 数据库管理

### 查看数据

在 Supabase 仪表板中，点击 **Table Editor** 可以查看和编辑所有表数据。

### 备份数据

Supabase 自动每天备份一次数据库。您也可以手动导出数据：
1. 点击 **Settings** → **Database**
2. 滚动到 **Backups** 部分
3. 点击 **Download backup**

### 监控性能

在 **Reports** → **Database** 可以查看：
- 慢查询
- 连接使用情况
- 存储使用情况

## 常见问题

### 1. 连接超时错误

**错误信息**: `Connection timeout`

**解决方案**:
- 检查 Supabase 项目状态
- 确认 `DATABASE_URL` 正确
- 增加 Sequelize 连接超时时间

### 2. SSL 证书错误

**错误信息**: `SSL certificate has expired`

**解决方案**:
- 已在 `database.js` 中配置 `rejectUnauthorized: false`
- 如果仍有问题，尝试移除 SSL 选项（不推荐用于生产环境）

### 3. 连接池耗尽

**错误信息**: `Too many connections`

**解决方案**:
- 免费套餐限制 60 个连接
- 考虑升级到付费计划
- 优化应用连接使用（连接池配置）

### 4. 表不存在错误

**错误信息**: `Relation "users" does not exist`

**解决方案**:
- 按照步骤 4 执行 SQL 脚本创建表
- 检查表名是否正确（注意大小写）

## 性能优化建议

1. **使用索引**: 为常用查询字段创建索引
2. **查询优化**: 避免 SELECT *，只查询需要的字段
3. **连接池**: 配置合理的连接池大小
4. **缓存**: 使用 Redis 缓存热点数据
5. **归档数据**: 定期归档历史数据

## 安全建议

1. **定期更改密码**: 定期更新 Supabase 数据库密码
2. **限制访问**: 配置 Supabase 的访问控制列表（RLS）
3. **启用 SSL**: 确保所有连接都使用 SSL
4. **监控日志**: 定期检查异常访问日志

## 费用说明

### Supabase 免费套餐
- 500MB 数据库存储
- 1GB 文件存储
- 2GB 带宽/月
- 60 个并发数据库连接
- 500MB 日志/月

### 何时需要升级
- 数据库存储超过 500MB
- 并发连接超过 60
- 需要更多功能（如边缘函数）

## 相关文档

- [Supabase 官方文档](https://supabase.com/docs)
- [Sequelize PostgreSQL 文档](https://sequelize.org/docs/v6/other-topics/postgres/)
- [Vercel 集成指南](https://vercel.com/docs/concepts/deployments/overview)

## 支持

如遇到问题，请：
1. 检查本文档的常见问题部分
2. 查看 Supabase 项目状态页面
3. 联系技术支持团队
