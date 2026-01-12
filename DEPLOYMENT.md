# 部署指南

本文档介绍如何将衍生品定价工具部署到生产环境。

## 部署选项

### 方式一：Vercel（推荐）

Vercel 提供免费的静态网站托管，非常适合 React 应用。

#### 步骤：

1. **安装 Vercel CLI**（可选，也可以使用网页界面）
```bash
npm install -g vercel
```

2. **登录 Vercel**
```bash
vercel login
```

3. **部署**
```bash
cd /Users/xulangliyuemanhua/Documents/Deriative/Deriativie
vercel
```

4. **生产环境部署**
```bash
vercel --prod
```

部署完成后，你会得到一个类似 `https://your-project.vercel.app` 的链接。

#### 使用 GitHub 自动部署（推荐）

1. 将代码推送到 GitHub
2. 访问 [vercel.com](https://vercel.com)
3. 点击 "New Project"
4. 导入你的 GitHub 仓库
5. Vercel 会自动检测 Vite 配置并部署

### 方式二：Netlify

1. **安装 Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **构建项目**
```bash
npm run build
```

3. **部署**
```bash
netlify deploy --prod --dir=dist
```

### 方式三：GitHub Pages

1. **安装 gh-pages**
```bash
npm install --save-dev gh-pages
```

2. **在 package.json 中添加部署脚本**
```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

3. **配置 vite.config.ts**
```typescript
export default defineConfig({
  base: '/your-repo-name/', // 替换为你的仓库名
  // ... 其他配置
})
```

4. **部署**
```bash
npm run deploy
```

### 方式四：传统服务器部署

1. **构建生产版本**
```bash
npm run build
```

2. **上传 dist 目录到服务器**

3. **配置 Nginx**（示例）
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 环境变量配置

如果需要配置环境变量，创建 `.env.production` 文件：

```env
VITE_APP_TITLE=衍生品定价工具
VITE_API_URL=https://api.example.com
```

## 性能优化建议

1. **启用 Gzip 压缩**
2. **配置 CDN**（Vercel 和 Netlify 自动提供）
3. **启用 HTTPS**
4. **配置缓存策略**

## 监控和分析

建议添加：
- Google Analytics
- Sentry（错误监控）
- 性能监控工具

## 注意事项

1. **数据存储**：当前使用 localStorage，数据存储在用户浏览器中
2. **安全性**：所有计算在客户端完成，不涉及服务器
3. **浏览器兼容性**：支持现代浏览器（Chrome, Firefox, Safari, Edge）

## 故障排除

### 构建失败
- 检查 Node.js 版本（建议 16+）
- 删除 node_modules 和 package-lock.json 后重新安装

### 路由问题
- 确保配置了正确的重写规则（见 vercel.json）

### 性能问题
- 检查构建产物大小
- 启用代码分割
- 优化图片资源

