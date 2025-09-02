# Coding Simple MCP

一个为 [CODING DevOps](https://coding.net/) 平台设计的 Model Context Protocol (MCP) 服务器，让 Claude AI 能够智能查询和分析你的项目数据。

> 感谢 CODING DevOps 平台提供强大的 API 支持，让开发者能够便捷地集成项目管理数据。

## ✨ 功能特性

- 🔍 **智能用户查询**: 一键获取用户基本信息和权限
- 📋 **项目管理**: 快速查看和筛选用户名下的所有项目  
- 🎯 **问题追踪**: 深度分析项目中的需求、缺陷和任务
- 🐛 **缺陷聚合**: 跨项目汇总缺陷，智能分类和优先级排序
- 📊 **工作概览**: 全方位展示个人工作负载和项目状态

## 🚀 快速开始

### 安装方式

#### NPM 安装（推荐）

```bash
# 全局安装
npm install -g coding-simple-mcp

# 或本地安装
npm install coding-simple-mcp
```

#### 从源码安装

```bash
git clone https://github.com/your-username/coding-simple-mcp.git
cd coding-simple-mcp
npm install
npm run build
```

## ⚙️ 配置指南

### 1. 获取 CODING API 凭证

1. 登录你的 CODING DevOps 平台
2. 进入**个人设置** → **访问令牌**  
3. 创建新的个人访问令牌，确保包含以下权限：
   - `user:profile:ro` - 读取用户信息
   - `project:read` - 读取项目信息
   - `issue:read` - 读取问题信息

### 2. Claude Desktop 配置

将以下配置添加到 Claude Desktop 配置文件：

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`  
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

#### 使用 npm 包（推荐）

```json
{
  "mcpServers": {
    "coding-simple-mcp": {
      "command": "npx",
      "args": ["coding-simple-mcp"],
      "env": {
        "API_BASE_URL": "https://your-team.coding.net/open-api",
        "API_TOKEN": "your-personal-access-token"
      }
    }
  }
}
```

#### 使用全局安装

```json
{
  "mcpServers": {
    "coding-simple-mcp": {
      "command": "coding-simple-mcp",
      "env": {
        "API_BASE_URL": "https://your-team.coding.net/open-api",
        "API_TOKEN": "your-personal-access-token"
      }
    }
  }
}
```

#### 从源码运行

```json
{
  "mcpServers": {
    "coding-simple-mcp": {
      "command": "node",
      "args": ["/path/to/coding-simple-mcp/dist/index.js"],
      "env": {
        "API_BASE_URL": "https://your-team.coding.net/open-api",
        "API_TOKEN": "your-personal-access-token"
      }
    }
  }
}
```

### 3. 重启 Claude Desktop

配置完成后重启 Claude Desktop，即可开始使用！

## 🛠️ 可用工具

### 1. `get_current_user`
获取当前登录用户的详细信息

```
示例：获取我的用户信息
```

### 2. `get_current_user_projects`
获取当前用户的项目列表（智能方法）

**参数**:
- `projectName` (可选): 项目名称过滤器

```
示例：
- 显示我的所有项目
- 查找包含"API"的项目
```

### 3. `get_user_projects`
获取指定用户的项目列表

**参数**:
- `userId` (必需): 目标用户ID
- `projectName` (可选): 项目名称过滤器

```
示例：查询用户ID 123的项目列表
```

### 4. `get_project_issues`
深度分析指定项目的问题统计

**参数**:
- `projectName` (必需): 项目名称
- `pageNumber` (可选): 页码，默认1
- `pageSize` (可选): 每页数量，默认100，最大500
- `issueType` (可选): 问题类型 - ALL/REQUIREMENT/DEFECT/MISSION/EPIC

```
示例：
- 分析"移动端项目"的所有问题
- 查看"后端API"项目的缺陷情况，每页50条
```

### 5. `get_my_defects` ⭐
智能聚合当前用户所有项目的缺陷信息

**参数**:
- `pageSize` (可选): 每个项目查询的缺陷数量，默认50，最大500
- `includeCompleted` (可选): 是否包含已完成的缺陷，默认false

```
示例：
- 获取我名下所有的缺陷
- 查看我的所有缺陷，包括已完成的
- 获取我的高优先级缺陷
```

**智能分析结果**:
- 📈 缺陷总数和状态分布
- 🎯 优先级热力图（0-4级）
- 📊 项目维度缺陷统计
- 🔍 最近更新的缺陷详情

### 6. `get_user_summary`
生成用户完整的工作仪表盘

```
示例：给我一个完整的工作概览
```

## 💡 智能对话示例

### 日常工作查询
- **"我今天有哪些需要处理的缺陷？"** → 调用 `get_my_defects`，展示活跃缺陷
- **"帮我分析一下移动端项目的进展"** → 调用 `get_project_issues`，提供项目洞察
- **"我负责了多少个项目？"** → 调用 `get_current_user_projects`，统计项目数量

### 团队协作查询  
- **"用户小王参与了哪些项目？"** → 调用 `get_user_projects`，团队透明化
- **"这个月我的工作量如何？"** → 调用 `get_user_summary`，工作负载分析

### 项目管理查询
- **"API项目还有多少未解决的问题？"** → 调用 `get_project_issues`，项目健康度
- **"优先级最高的缺陷是什么？"** → 调用 `get_my_defects`，优先级排序

## 🔧 高级配置

### 系统环境变量（可选）

如果你希望在系统级别配置 API 参数，可以设置环境变量：

```bash
# Windows (PowerShell)
$env:API_BASE_URL="https://your-team.coding.net/open-api"
$env:API_TOKEN="your-token"

# Linux/macOS
export API_BASE_URL="https://your-team.coding.net/open-api"
export API_TOKEN="your-token"
```

> **推荐做法**: 直接在 Claude Desktop 配置中使用 `env` 字段，更加直观和安全。

## 🛡️ 安全最佳实践

1. **🔐 令牌安全**: 个人访问令牌具有敏感权限，请妥善保管
2. **⏰ 定期轮换**: 建议定期更新访问令牌
3. **🎯 最小权限**: 只授予必要的 API 权限
4. **🚫 避免硬编码**: 永远不要在代码中硬编码令牌

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发环境

```bash
git clone https://github.com/your-username/coding-simple-mcp.git
cd coding-simple-mcp
npm install
npm run dev
```

### 提交规范

- 🐛 `fix:` 修复问题
- ✨ `feat:` 新功能  
- 📚 `docs:` 文档更新
- 🔧 `config:` 配置修改

## 📄 开源协议

本项目采用 [MIT License](LICENSE.md) 开源协议。

## 🙏 致谢

- 感谢 [CODING DevOps](https://coding.net/) 平台提供的强大 API 支持
- 感谢 [Anthropic](https://anthropic.com/) 开发的 Model Context Protocol
- 感谢开源社区的贡献者们

## 📞 支持

- 🐛 问题反馈: [GitHub Issues](https://github.com/your-username/coding-simple-mcp/issues)
- 💬 功能建议: [GitHub Discussions](https://github.com/your-username/coding-simple-mcp/discussions)
- 📧 联系邮箱: your-email@example.com

---

**让 AI 助力你的项目管理，让工作更高效！** 🚀