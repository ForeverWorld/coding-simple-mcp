# 发布到 NPM 指南

## 发布前检查

1. **确保所有敏感信息已清理**：
   - ✅ API URL 和 Token 已从所有文件中移除
   - ✅ .gitignore 文件已创建
   - ✅ 只有示例配置文件包含占位符

2. **构建和测试**：
   ```bash
   npm run build
   npm run start  # 测试是否正常启动
   ```

3. **检查要发布的文件**：
   ```bash
   npm pack --dry-run
   ```

## 发布步骤

### 1. 登录 npm
```bash
npm login
```

### 2. 发布包
```bash
npm publish
```

### 3. 验证发布
```bash
npm view coding-simple-mcp
```

## 更新版本

使用 npm version 命令自动更新版本并创建 git tag：

```bash
# 补丁版本 (1.0.0 -> 1.0.1)
npm version patch

# 次要版本 (1.0.0 -> 1.1.0) 
npm version minor

# 主要版本 (1.0.0 -> 2.0.0)
npm version major
```

然后重新发布：
```bash
npm publish
```

## GitHub 发布

1. **推送到 GitHub**：
   ```bash
   git add .
   git commit -m "Initial release"
   git remote add origin https://github.com/wdx/coding-simple-mcp.git
   git push -u origin main
   ```

2. **创建 Release**：
   - 在 GitHub 上创建新的 Release
   - 使用 v1.0.0 格式的标签
   - 包含更新日志

## 发布后用户安装

用户可以通过以下方式安装：

```bash
# 全局安装
npm install -g coding-simple-mcp

# 本地安装
npm install coding-simple-mcp

# 使用 npx 直接运行
npx coding-simple-mcp
```

## 安全提醒

- ✅ 确保 `.env` 文件在 .gitignore 中
- ✅ 确保没有硬编码的敏感信息
- ✅ 所有示例配置都使用占位符