#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

// 从环境变量获取API配置，如果不存在则抛出错误
const API_BASE_URL = process.env.API_BASE_URL;
const API_TOKEN = process.env.API_TOKEN;

if (!API_BASE_URL || !API_TOKEN) {
  console.error("❌ 缺少必要的环境变量:");
  if (!API_BASE_URL) console.error("   - API_BASE_URL");
  if (!API_TOKEN) console.error("   - API_TOKEN");
  console.error("请在Claude Desktop配置中设置这些环境变量。");
  process.exit(1);
}

interface UserInfo {
  Id: number;
  Status: number;
  Email: string;
  GlobalKey: string;
  Avatar: string;
  Name: string;
  NamePinYin: string;
  Phone: string;
}

interface Project {
  Id: number;
  Name: string;
  DisplayName: string;
  Description: string;
  Status: number;
  CreatedAt: number;
  UpdatedAt: number;
}

interface Issue {
  Code: number;
  Type: string;
  Name: string;
  Description: string;
  IssueStatusName: string;
  Priority: string;
  CreatedAt: number;
  UpdatedAt: number;
}

class CodingMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "coding-simple-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "get_current_user",
          description: "获取当前用户信息",
          inputSchema: {
            type: "object",
            properties: {},
            required: [],
          },
        },
        {
          name: "get_user_projects",
          description: "获取指定用户的项目列表",
          inputSchema: {
            type: "object",
            properties: {
              userId: {
                type: "number",
                description: "用户ID（必填）",
              },
              projectName: {
                type: "string",
                description: "项目名称（可选，用于过滤）",
              },
            },
            required: ["userId"],
          },
        },
        {
          name: "get_project_issues",
          description: "获取指定项目的需求和缺陷统计信息",
          inputSchema: {
            type: "object",
            properties: {
              projectName: {
                type: "string",
                description: "项目名称（必填）",
              },
              pageNumber: {
                type: "number",
                description: "页码，默认1",
                default: 1,
              },
              pageSize: {
                type: "number",
                description: "每页数量，默认100，最大500",
                default: 100,
              },
              issueType: {
                type: "string",
                description: "问题类型：ALL（全部）、REQUIREMENT（需求）、DEFECT（缺陷）、MISSION（任务）、EPIC（史诗）",
                default: "ALL",
              },
            },
            required: ["projectName"],
          },
        },
        {
          name: "get_current_user_projects",
          description: "获取当前用户的项目列表（便利方法，自动获取当前用户ID）",
          inputSchema: {
            type: "object",
            properties: {
              projectName: {
                type: "string",
                description: "项目名称（可选，用于过滤）",
              },
            },
            required: [],
          },
        },
        {
          name: "get_my_defects",
          description: "获取当前用户名下所有项目的缺陷列表和统计信息",
          inputSchema: {
            type: "object",
            properties: {
              pageSize: {
                type: "number",
                description: "每个项目查询的缺陷数量，默认50，最大500",
                default: 50,
              },
              includeCompleted: {
                type: "boolean",
                description: "是否包含已完成的缺陷，默认false（只显示未完成的）",
                default: false,
              },
            },
            required: [],
          },
        },
        {
          name: "get_user_summary",
          description: "获取用户完整工作概览：用户信息 + 项目列表 + 各项目的需求缺陷统计",
          inputSchema: {
            type: "object",
            properties: {},
            required: [],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case "get_current_user":
          return this.getCurrentUser();
        case "get_user_projects":
          return this.getUserProjects(
            request.params.arguments?.userId as number,
            request.params.arguments?.projectName as string
          );
        case "get_project_issues":
          return this.getProjectIssues(
            request.params.arguments?.projectName as string,
            request.params.arguments?.pageNumber as number,
            request.params.arguments?.pageSize as number,
            request.params.arguments?.issueType as string
          );
        case "get_current_user_projects":
          return this.getCurrentUserProjects(request.params.arguments?.projectName as string);
        case "get_my_defects":
          return this.getMyDefects(
            request.params.arguments?.pageSize as number,
            request.params.arguments?.includeCompleted as boolean
          );
        case "get_user_summary":
          return this.getUserSummary();
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    });
  }

  private async getCurrentUser() {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/?Action=DescribeCodingCurrentUser&action=DescribeCodingCurrentUser`,
        {},
        {
          headers: {
            Accept: "application/json",
            Authorization: `token ${API_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      const userInfo: UserInfo = response.data.Response.User;
      
      return {
        content: [
          {
            type: "text",
            text: `当前用户信息：
ID: ${userInfo.Id}
姓名: ${userInfo.Name}
邮箱: ${userInfo.Email}
电话: ${userInfo.Phone}
状态: ${userInfo.Status === 1 ? "正常" : "禁用"}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `获取用户信息失败: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async getMyDefects(pageSize = 50, includeCompleted = false) {
    try {
      // 限制 pageSize 最大值
      if (pageSize > 500) {
        pageSize = 500;
      }

      // 1. 获取当前用户信息
      const userResponse = await axios.post(
        `${API_BASE_URL}/?Action=DescribeCodingCurrentUser&action=DescribeCodingCurrentUser`,
        {},
        {
          headers: {
            Accept: "application/json",
            Authorization: `token ${API_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      const userInfo: UserInfo = userResponse.data.Response.User;

      // 2. 获取用户所有项目
      const projectResponse = await axios.post(
        `${API_BASE_URL}/?Action=DescribeUserProjects&action=DescribeUserProjects`,
        {
          UserId: userInfo.Id,
          ProjectName: "",
        },
        {
          headers: {
            Accept: "application/json",
            Authorization: `token ${API_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      const projects: Project[] = projectResponse.data.Response.ProjectList;
      
      let allDefects: (Issue & { projectName: string })[] = []; // 添加项目名称字段
      let projectDefectCounts: { [key: string]: number } = {};
      let totalDefects = 0;
      let completedDefects = 0;
      let activeDefects = 0;

      // 3. 遍历每个项目，获取缺陷
      for (const project of projects) {
        try {
          const issueResponse = await axios.post(
            `${API_BASE_URL}/DescribeIssueListWithPage?Action=DescribeIssueListWithPage`,
            {
              Conditions: [],
              ExcludeSubTask: true,
              IssueType: "DEFECT",
              PageNumber: "1",
              PageSize: pageSize.toString(),
              ProjectName: project.Name,
              ShowSubIssues: true,
              SortKey: "UPDATED_AT",
              SortValue: "DESC",
            },
            {
              headers: {
                Accept: "application/json",
                Authorization: `token ${API_TOKEN}`,
                "Content-Type": "application/json",
              },
            }
          );

          const projectDefects: Issue[] = issueResponse.data.Response.Data.List || [];
          
          // 根据 includeCompleted 参数过滤缺陷
          const filteredDefects = includeCompleted 
            ? projectDefects 
            : projectDefects.filter(defect => 
                defect.IssueStatusName !== "已完成"
              );

          // 为每个缺陷添加项目信息
          const defectsWithProject = filteredDefects.map(defect => ({
            ...defect,
            projectName: project.DisplayName
          }));

          if (filteredDefects.length > 0) {
            allDefects.push(...defectsWithProject);
            projectDefectCounts[project.DisplayName] = filteredDefects.length;
          }

          // 统计
          projectDefects.forEach(defect => {
            totalDefects++;
            if (defect.IssueStatusName === "已完成") {
              completedDefects++;
            } else {
              activeDefects++;
            }
          });

        } catch (error) {
          console.error(`获取项目 ${project.Name} 的缺陷失败:`, error);
          // 继续处理下一个项目
        }
      }

      // 4. 生成报告
      const priorityCounts = { "0": 0, "1": 0, "2": 0, "3": 0, "4": 0 };
      allDefects.forEach(defect => {
        if (priorityCounts.hasOwnProperty(defect.Priority)) {
          priorityCounts[defect.Priority as keyof typeof priorityCounts]++;
        }
      });

      const projectSummary = Object.entries(projectDefectCounts)
        .map(([projectName, count]) => `${projectName}: ${count} 个`)
        .join("\n");

      const recentDefects = allDefects
        .slice(0, 10)
        .map((defect, index) => {          
          return `${index + 1}. 【${defect.Priority}级】${defect.Name}
   项目: ${defect.projectName}
   状态: ${defect.IssueStatusName}
   更新时间: ${new Date(defect.UpdatedAt).toLocaleDateString()}`;
        })
        .join("\n\n");

      const resultText = `🐛 ${userInfo.Name} 的缺陷总览

📊 统计信息：
- 总缺陷数: ${totalDefects}
- 活跃缺陷: ${activeDefects}
- 已完成缺陷: ${completedDefects}
- 当前显示: ${allDefects.length} 个${includeCompleted ? '' : '（已过滤已完成）'}

🎯 优先级分布：
- 最高（0级）: ${priorityCounts["0"]}
- 高（1级）: ${priorityCounts["1"]}  
- 中（2级）: ${priorityCounts["2"]}
- 低（3级）: ${priorityCounts["3"]}
- 最低（4级）: ${priorityCounts["4"]}

📋 项目分布：
${projectSummary || "暂无缺陷"}

🔍 最近更新的10个缺陷：
${recentDefects || "暂无缺陷"}

💡 提示: 使用 includeCompleted=true 可以查看包含已完成的缺陷`;

      return {
        content: [
          {
            type: "text",
            text: resultText,
          },
        ],
      };

    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `获取缺陷信息失败: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async getCurrentUserProjects(projectName?: string) {
    try {
      // 首先获取当前用户信息
      const userResponse = await axios.post(
        `${API_BASE_URL}/?Action=DescribeCodingCurrentUser&action=DescribeCodingCurrentUser`,
        {},
        {
          headers: {
            Accept: "application/json",
            Authorization: `token ${API_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      const userId = userResponse.data.Response.User.Id;
      
      // 调用 getUserProjects 获取项目列表
      return this.getUserProjects(userId, projectName);
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `获取当前用户项目列表失败: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async getUserProjects(userId: number, projectName?: string) {
    try {
      if (!userId) {
        throw new McpError(
          ErrorCode.InvalidParams,
          "UserId 参数是必填的"
        );
      }

      const response = await axios.post(
        `${API_BASE_URL}/?Action=DescribeUserProjects&action=DescribeUserProjects`,
        {
          UserId: userId,
          ProjectName: projectName || "",
        },
        {
          headers: {
            Accept: "application/json",
            Authorization: `token ${API_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      const projects: Project[] = response.data.Response.ProjectList;
      
      const projectsText = projects
        .map(
          (project, index) =>
            `${index + 1}. ${project.DisplayName} (${project.Name})
   描述: ${project.Description || "无"}
   状态: ${project.Status === 1 ? "正常" : "禁用"}
   创建时间: ${new Date(project.CreatedAt).toLocaleDateString()}`
        )
        .join("\n\n");

      return {
        content: [
          {
            type: "text",
            text: `用户项目列表 (共 ${projects.length} 个项目)：\n\n${projectsText}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `获取项目列表失败: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async getProjectIssues(projectName: string, pageNumber = 1, pageSize = 100, issueType = "ALL") {
    try {
      if (!projectName) {
        throw new McpError(
          ErrorCode.InvalidParams,
          "ProjectName 参数是必填的"
        );
      }

      // 验证 pageSize 不超过最大值 500
      if (pageSize > 500) {
        pageSize = 500;
      }

      const response = await axios.post(
        `${API_BASE_URL}/DescribeIssueListWithPage?Action=DescribeIssueListWithPage`,
        {
          Conditions: [],
          ExcludeSubTask: true,
          IssueType: issueType,
          PageNumber: pageNumber.toString(),
          PageSize: pageSize.toString(),
          ProjectName: projectName,
          ShowSubIssues: true,
          SortKey: "CODE",
          SortValue: "DESC",
        },
        {
          headers: {
            Accept: "application/json",
            Authorization: `token ${API_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data.Response.Data;
      const issues: Issue[] = data.List;
      
      const typeCounts = {
        REQUIREMENT: 0,
        DEFECT: 0,
        MISSION: 0,
        total: issues.length,
      };

      const statusCounts = {
        completed: 0,
        inProgress: 0,
        pending: 0,
      };

      issues.forEach((issue) => {
        if (issue.Type === "REQUIREMENT") typeCounts.REQUIREMENT++;
        else if (issue.Type === "DEFECT") typeCounts.DEFECT++;
        else if (issue.Type === "MISSION") typeCounts.MISSION++;

        if (issue.IssueStatusName === "已完成") statusCounts.completed++;
        else if (issue.IssueStatusName.includes("进行中")) statusCounts.inProgress++;
        else statusCounts.pending++;
      });

      const recentIssues = issues
        .slice(0, 5)
        .map(
          (issue, index) =>
            `${index + 1}. [${issue.Type}] ${issue.Name}
   状态: ${issue.IssueStatusName}
   优先级: ${issue.Priority}
   创建时间: ${new Date(issue.CreatedAt).toLocaleDateString()}`
        )
        .join("\n\n");

      return {
        content: [
          {
            type: "text",
            text: `项目 "${projectName}" 的问题统计：

📊 问题类型统计：
- 用户故事/需求 (REQUIREMENT): ${typeCounts.REQUIREMENT}
- 缺陷 (DEFECT): ${typeCounts.DEFECT}  
- 任务 (MISSION): ${typeCounts.MISSION}
- 总计: ${typeCounts.total}

📈 状态统计：
- 已完成: ${statusCounts.completed}
- 进行中: ${statusCounts.inProgress}
- 待处理: ${statusCounts.pending}

📝 最近5个问题：
${recentIssues}

总页数: ${data.TotalPage}, 总数量: ${data.TotalCount}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `获取项目问题失败: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async getUserSummary() {
    try {
      const userResponse = await axios.post(
        `${API_BASE_URL}/?Action=DescribeCodingCurrentUser&action=DescribeCodingCurrentUser`,
        {},
        {
          headers: {
            Accept: "application/json",
            Authorization: `token ${API_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      const userInfo: UserInfo = userResponse.data.Response.User;

      const projectResponse = await axios.post(
        `${API_BASE_URL}/?Action=DescribeUserProjects&action=DescribeUserProjects`,
        {
          UserId: userInfo.Id,
          ProjectName: "",
        },
        {
          headers: {
            Accept: "application/json",
            Authorization: `token ${API_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      const projects: Project[] = projectResponse.data.Response.ProjectList;

      let summaryText = `👤 用户信息：
姓名: ${userInfo.Name}
邮箱: ${userInfo.Email}
项目总数: ${projects.length}

📋 项目工作概览：\n`;

      let totalRequirements = 0;
      let totalDefects = 0;
      let totalMissions = 0;
      let totalIssues = 0;

      for (const project of projects.slice(0, 10)) {
        try {
          const issueResponse = await axios.post(
            `${API_BASE_URL}/DescribeIssueListWithPage?Action=DescribeIssueListWithPage`,
            {
              Conditions: [],
              ExcludeSubTask: true,
              IssueType: "ALL",
              PageNumber: "1",
              PageSize: "1",
              ProjectName: project.Name,
              ShowSubIssues: true,
              SortKey: "CODE",
              SortValue: "DESC",
            },
            {
              headers: {
                Accept: "application/json",
                Authorization: `token ${API_TOKEN}`,
                "Content-Type": "application/json",
              },
            }
          );

          const count = issueResponse.data.Response.Data.TotalCount;
          totalIssues += count;

          summaryText += `\n${project.DisplayName}: ${count} 个问题`;
        } catch (error) {
          summaryText += `\n${project.DisplayName}: 获取失败`;
        }
      }

      summaryText += `\n\n📊 工作总结：
- 管理项目: ${projects.length} 个
- 问题总数: ${totalIssues} 个（仅统计前10个项目）
- 平均每项目: ${projects.length > 0 ? Math.round(totalIssues / Math.min(projects.length, 10)) : 0} 个问题`;

      return {
        content: [
          {
            type: "text",
            text: summaryText,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `获取用户概览失败: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Coding MCP server running on stdio");
  }
}

const server = new CodingMCPServer();
server.run().catch(console.error);