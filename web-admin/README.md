# Web Admin - Vue 3 管理后台

## 技术栈

- Vue 3 + TypeScript
- Vite
- Vue Router
- Pinia (状态管理)
- Element Plus (UI组件库)
- ECharts (图表)
- Axios (HTTP请求)

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 目录结构

```
src/
├── api/              # API接口
├── assets/           # 静态资源
├── components/       # 通用组件
├── layouts/          # 布局组件
├── router/           # 路由配置
├── stores/           # Pinia状态管理
├── utils/            # 工具函数
├── views/            # 页面组件
│   ├── dashboard/    # 仪表盘
│   ├── hospitals/    # 医院管理
│   ├── doctors/      # 医生管理
│   ├── patients/     # 患者管理
│   ├── scales/       # 量表管理
│   ├── statistics/   # 数据统计
│   └── system/       # 系统设置
├── App.vue
└── main.ts
```
