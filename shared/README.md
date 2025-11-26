# Shared - 前后端共享类型定义

## 说明

此目录包含前后端共享的TypeScript类型定义和常量配置。

## 目录结构

```
shared/
├── types/            # 类型定义
│   ├── user.types.ts      # 用户相关类型
│   ├── stage.types.ts     # 阶段相关类型
│   ├── patient.types.ts   # 患者相关类型
│   ├── scale.types.ts     # 量表相关类型
│   └── ...
├── constants/        # 常量配置
│   ├── stages.ts          # 阶段配置常量
│   ├── scales.ts          # 量表配置常量
│   └── enums.ts           # 枚举常量
└── index.ts          # 统一导出
```

## 使用方法

### 在Backend中使用

```typescript
import { UserRole, PatientStage, STAGE_CONFIG } from '@shared';
```

### 在Web-Admin中使用

```typescript
import { UserRole, PatientStage, SCALE_INFO } from '@shared';
```

### 在Miniprogram中使用

由于uni-app小程序项目路径解析的特殊性,可以直接复制需要的类型文件。
