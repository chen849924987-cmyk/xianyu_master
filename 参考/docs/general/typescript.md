# TypeScript 配置规范

## 配置概览

| 项目 | 配置 |
|------|------|
| 目标版本 | ES2022 |
| 模块系统 | NodeNext（脚本/后端）/ ESNext（前端） |
| 严格模式 | 启用（`strict: true`） |
| 跳过库检查 | 启用（`skipLibCheck: true`） |

## 根目录 tsconfig.json（脚本/后端）

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## web/tsconfig.json（前端）

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "types": ["vite/client"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src", "vite.config.ts"]
}
```

## 关键规则

1. **严格模式必须启用** - 所有项目开启 `strict: true`
2. **使用 ES2022 目标** - 支持现代 JavaScript 特性
3. **ESM 模块** - 使用 `"type": "module"`，导入带 `.js` 扩展名
4. **路径别名** - 前端使用 `@/` 别名指向 `src/`
