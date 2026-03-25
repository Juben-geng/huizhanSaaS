# 会展智能建联SaaS系统

一个智能化的会展SaaS管理系统，支持主办方管理、展会管理、用户管理等功能。

## 技术栈

### 后端
- Node.js + Express
- SQLite + Sequelize ORM
- JWT 认证
- bcryptjs 密码加密

### 前端
- Vue 3 + Vite
- Element Plus UI
- Vue Router
- Pinia 状态管理
- Axios HTTP 客户端

## 功能模块

- 数据看板
- 主办方管理
- 角色权限
- 套餐管理
- 展会管理
- 用户管理
- 财务管理
- 操作日志
- 小程序管理
- 系统设置

## 快速开始

### 后端安装

```bash
cd backend
npm install
npm start
```

后端服务运行在 `http://localhost:3001`

### 前端安装

```bash
cd admin/platform
npm install
npm run dev
```

前端开发服务器运行在 `http://localhost:5174`

## 默认登录凭证

### 管理员
- 用户名: `admin`
- 密码: `admin123456`

### 教师
- 用户名: `teacher`
- 密码: `teacher123456`

## API 接口

- 登录接口: `POST /api/platform/auth/login`
- 主办方管理: `/api/platform/organizer`
- 角色权限: `/api/platform/role`
- 套餐管理: `/api/platform/package`
- 展会管理: `/api/platform/exhibition`

## 项目结构

```
会展智能建联SaaS系统/
├── backend/              # 后端服务
│   ├── src/
│   │   ├── config/      # 配置文件
│   │   ├── models/      # 数据模型
│   │   ├── routes/      # 路由
│   │   └── utils/       # 工具函数
│   └── database/        # 数据库文件
├── admin/               # 管理后台
│   └── platform/
│       ├── src/
│       │   ├── views/   # 页面组件
│       │   ├── router/  # 路由配置
│       │   └── stores/  # 状态管理
│       └── dist/        # 构建输出
└── README.md
```

## 开发说明

- 后端使用 SQLite 数据库，数据库文件位于 `backend/database/` 目录
- 前端使用 Vite 开发服务器，支持热更新
- 所有 API 请求都需要在请求头中携带 JWT token

## License

MIT
