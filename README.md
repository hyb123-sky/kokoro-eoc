# 🚀 KOKORO EOC - 企业级灾害响应指挥中心

## 完整部署指南

---

## 📋 目录

1. [项目概述](#项目概述)
2. [架构决策说明](#架构决策说明)
3. [PDI 环境配置](#pdi-环境配置)
4. [本地开发环境搭建](#本地开发环境搭建)
5. [ServiceNow 集成配置](#servicenow-集成配置)
6. [GitHub + CI/CD 部署](#github-cicd-部署)
7. [进阶功能实现路线](#进阶功能实现路线)
8. [常见问题](#常见问题)

---

## 项目概述

KOKORO EOC 是一个**企业级灾害响应指挥中心**应用，采用以下核心技术栈：

| 层级 | 技术 | 用途 |
|------|------|------|
| 前端 | React 18 + TypeScript | 用户界面 |
| 状态管理 | Zustand + TanStack Query | 解决"意大利面条代码"问题 |
| 样式 | Tailwind CSS | 工业/赛博朋克风格 |
| 后端数据 | ServiceNow (PDI) | 工单、物资、人员管理 |
| 实时数据 | Firebase/Supabase (预留) | 车辆轨迹、传感器数据 |
| 外部 API | USGS、Open-Meteo | 地震、天气数据 |
| AI | OpenAI/Claude (预留) | 智能决策辅助 |
| 部署 | Vercel + GitHub Actions | 自动化 CI/CD |

---

## 架构决策说明

### 1. 数据流设计 (Sidecar 模式)

```
┌─────────────────────────────────────────────────────────────┐
│                        KOKORO React App                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────────┐       ┌──────────────────┐           │
│   │  TanStack Query │       │     Zustand      │           │
│   │  (数据缓存)      │       │   (UI 状态)      │           │
│   └────────┬────────┘       └────────┬─────────┘           │
│            │                         │                      │
│            ▼                         ▼                      │
│   ┌─────────────────────────────────────────────┐          │
│   │              服务层 (services/)              │          │
│   └─────────────────────────────────────────────┘          │
│            │                         │                      │
└────────────┼─────────────────────────┼──────────────────────┘
             │                         │
    ┌────────▼────────┐      ┌────────▼────────┐
    │   ServiceNow    │      │  外部 API       │
    │   (低频数据)     │      │  (实时数据)      │
    │                 │      │                 │
    │ • 工单          │      │ • USGS 地震     │
    │ • 物资          │      │ • Open-Meteo    │
    │ • 人员          │      │ • Firebase      │
    └─────────────────┘      └─────────────────┘
```

**关键点**：
- ServiceNow 只存储**低频业务数据**（工单、物资清单）
- **高频数据**（GPS 轨迹、传感器）使用 Firebase/Supabase
- TanStack Query 自动缓存，避免重复请求

### 2. 状态管理策略

```typescript
// 三层状态分离
useAppStore()       // UI 状态：侧边栏、选中项、主题
useMapStore()       // 地图状态：视口、图层、标记
useNotificationStore() // 通知状态
useAICopilotStore() // AI 对话状态
useStatsStore()     // 统计数据

// TanStack Query 管理服务端数据
useIncidents()      // 缓存 5 分钟，30 秒刷新
useEarthquakes()    // 缓存 1 分钟，2 分钟刷新
useWeather()        // 缓存 10 分钟
```

---

## PDI 环境配置

### 步骤 1: 申请 PDI (Personal Developer Instance)

1. 访问 [developer.servicenow.com](https://developer.servicenow.com)
2. 注册账号并登录
3. 点击 **"Start Building"** → **"Request Instance"**
4. 选择最新版本 (如 Washington DC)
5. 等待实例创建 (约 10-15 分钟)
6. 记录你的实例 URL: `https://devXXXXX.service-now.com`

### 步骤 2: 创建自定义表

在 PDI 中执行以下操作：

```
1. 登录你的 PDI 实例
2. 导航至: System Definition → Tables
3. 点击 "New" 创建以下表:
```

#### 表 1: 灾害资源表 (u_kokoro_resource)

| 列名 | 类型 | 说明 |
|------|------|------|
| u_name | String (100) | 资源名称 |
| u_type | Choice | vehicle/medical/food/shelter/personnel/equipment |
| u_status | Choice | available/deployed/maintenance/unavailable |
| u_quantity | Integer | 数量 |
| u_location | String (200) | 位置描述 |
| u_latitude | Decimal | 纬度 |
| u_longitude | Decimal | 经度 |

#### 表 2: 避难所表 (u_kokoro_shelter)

| 列名 | 类型 | 说明 |
|------|------|------|
| u_name | String (100) | 避难所名称 |
| u_address | String (200) | 地址 |
| u_capacity | Integer | 容量 |
| u_current_occupancy | Integer | 当前人数 |
| u_status | Choice | open/closed/full |
| u_latitude | Decimal | 纬度 |
| u_longitude | Decimal | 经度 |

### 步骤 3: 配置 REST API 访问

```
1. 导航至: System Web Services → REST API Explorer
2. 验证可以访问 /api/now/table/incident
3. 创建集成用户:
   - User Administration → Users → New
   - 用户名: kokoro_integration
   - 角色: rest_api_explorer, itil
```

### 步骤 4: 配置 CORS

```
1. 导航至: System Web Services → REST → CORS Rules
2. 点击 "New"
3. 配置:
   - Name: KOKORO React App
   - REST API: Table API
   - Domain: http://localhost:3000
   - (生产环境添加你的 Vercel 域名)
```

---

## 本地开发环境搭建

### 前提条件

- Node.js 18+ (推荐使用 nvm)
- Git
- VS Code (推荐)

### 步骤 1: 克隆/下载项目

```bash
# 如果你有这个压缩包
unzip kokoro-eoc.zip
cd kokoro-eoc

# 或者从 GitHub 克隆
git clone https://github.com/YOUR_USERNAME/kokoro-eoc.git
cd kokoro-eoc
```

### 步骤 2: 安装依赖

```bash
npm install
```

### 步骤 3: 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑 .env.local
# 填入你的 PDI 实例信息
```

### 步骤 4: 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000` 查看应用。

---

## ServiceNow 集成配置

### 跨域代理配置

由于浏览器安全策略，直接从前端访问 ServiceNow API 会遇到 CORS 问题。解决方案：

#### 方案 A: Vite 开发代理 (已配置)

`vite.config.ts` 已包含代理配置：

```typescript
server: {
  proxy: {
    '/api/servicenow': {
      target: 'https://your-instance.service-now.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/servicenow/, '/api'),
    }
  }
}
```

#### 方案 B: Vercel Serverless 函数 (生产环境推荐)

创建 `api/servicenow/[...path].ts`:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = (req.query.path as string[]).join('/');
  const serviceNowUrl = `${process.env.SERVICENOW_INSTANCE_URL}/api/now/${path}`;
  
  const response = await fetch(serviceNowUrl, {
    method: req.method,
    headers: {
      'Authorization': `Basic ${Buffer.from(
        `${process.env.SERVICENOW_USERNAME}:${process.env.SERVICENOW_PASSWORD}`
      ).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
  });
  
  const data = await response.json();
  res.status(response.status).json(data);
}
```

### 测试 API 连接

```typescript
// 在浏览器控制台测试
const response = await fetch('/api/servicenow/table/incident?sysparm_limit=5');
const data = await response.json();
console.log(data);
```

---

## GitHub + CI/CD 部署

### 步骤 1: 创建 GitHub 仓库

```bash
# 初始化 Git
git init

# 添加所有文件
git add .

# 首次提交
git commit -m "feat: initial KOKORO EOC setup"

# 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/kokoro-eoc.git

# 推送
git push -u origin main
```

### 步骤 2: 连接 Vercel

1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 登录
3. 点击 **"New Project"**
4. 选择你的 `kokoro-eoc` 仓库
5. 配置环境变量:
   - `SERVICENOW_INSTANCE_URL`
   - `SERVICENOW_USERNAME`
   - `SERVICENOW_PASSWORD`
   - `VITE_MAPBOX_ACCESS_TOKEN` (如果使用)
6. 点击 **"Deploy"**

### 步骤 3: GitHub Actions 配置

创建 `.github/workflows/ci.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run lint
      
      - name: Build
        run: npm run build
        env:
          VITE_SERVICENOW_INSTANCE_URL: ${{ secrets.SERVICENOW_INSTANCE_URL }}

  # Vercel 会自动触发部署，无需额外配置
```

---

## 进阶功能实现路线

### 短期 (1-2 周)

1. **连接真实 ServiceNow 数据**
   - 替换 `demoIncidents` → 真实 API 调用
   - 实现 CRUD 操作
   - 添加错误处理

2. **集成 Mapbox**
   ```bash
   # 安装已包含在 package.json
   npm install
   ```
   
   替换 `MapPanel.tsx` 中的 SVG 占位符为真实 Mapbox 组件。

### 中期 (3-4 周)

3. **引入 Deck.gl**
   ```typescript
   import { HexagonLayer } from '@deck.gl/aggregation-layers';
   import { ScatterplotLayer } from '@deck.gl/layers';
   
   // 创建 3D 可视化效果
   const hexagonLayer = new HexagonLayer({
     data: incidents,
     getPosition: d => [d.longitude, d.latitude],
     radius: 200,
     elevationScale: 4,
   });
   ```

4. **实现实时数据 (Firebase)**
   ```typescript
   // 车辆追踪
   import { getDatabase, ref, onValue } from 'firebase/database';
   
   const db = getDatabase();
   const vehiclesRef = ref(db, 'vehicles');
   
   onValue(vehiclesRef, (snapshot) => {
     const vehicles = snapshot.val();
     updateVehicleMarkers(vehicles);
   });
   ```

### 长期 (2 月+)

5. **AI Copilot 集成**
   ```typescript
   // 调用 OpenAI API
   const response = await fetch('https://api.openai.com/v1/chat/completions', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       model: 'gpt-4',
       messages: [
         { role: 'system', content: '你是灾害响应指挥中心的AI助手...' },
         { role: 'user', content: userQuery },
       ],
     }),
   });
   ```

---

## 常见问题

### Q: CORS 错误怎么解决？

确保：
1. PDI 中配置了 CORS 规则
2. 开发时使用 Vite 代理
3. 生产环境使用 Serverless 函数

### Q: ServiceNow API 返回 401？

检查：
1. 用户名密码是否正确
2. 用户是否有 `rest_api_explorer` 角色
3. 密码是否已过期

### Q: 如何在 PDI 上测试？

ServiceNow PDI 支持：
- REST API 调用
- 自定义表
- 脚本执行
- 工作流

**不支持** (企业版功能):
- 某些高级集成
- 部分插件

### Q: 数据刷新太频繁？

调整 TanStack Query 配置：

```typescript
useQuery({
  queryKey: ['incidents'],
  queryFn: fetchIncidents,
  staleTime: 1000 * 60 * 5,  // 5 分钟后才重新请求
  refetchInterval: 1000 * 60, // 1 分钟自动刷新
});
```

---

## 项目结构

```
kokoro-eoc/
├── src/
│   ├── components/
│   │   ├── dashboard/      # 主界面组件
│   │   ├── map/            # 地图组件
│   │   ├── incidents/      # 事件管理
│   │   ├── resources/      # 资源管理
│   │   ├── weather/        # 天气组件
│   │   ├── ai-copilot/     # AI 助手
│   │   └── sidebar/        # 侧边栏
│   ├── hooks/
│   │   └── useQueries.ts   # TanStack Query hooks
│   ├── stores/
│   │   └── index.ts        # Zustand stores
│   ├── services/
│   │   ├── servicenow.ts   # ServiceNow API
│   │   └── external-api.ts # 外部 API
│   ├── types/
│   │   └── index.ts        # TypeScript 类型
│   ├── styles/
│   │   └── globals.css     # 全局样式
│   ├── App.tsx
│   └── main.tsx
├── public/
├── .env.example
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

---

## 联系与支持

如有问题，请在 GitHub Issues 中提出。

**Happy Coding! 🚀**
