# MCP 工具

CloudBase AI ToolKit 提供了完整的 MCP 工具集，支持云开发的各种操作。

## 🛠️ 云开发 MCP 工具一览

| 工具名称 | 功能简介 |
|----------|----------|
| login | 登录并自动配置云开发环境 |
| logout | 登出当前云开发账户 |
| downloadTemplate | 下载CloudBase项目模板（React、小程序、AI编辑器配置等） |
| listEnvs | 获取所有云开发环境信息 |
| getEnvAuthDomains | 获取云开发环境的合法域名列表 |
| manageEnvDomain | 统一的环境域名管理（添加/删除安全域名） |
| getEnvInfo | 获取当前云开发环境信息 |
| updateEnvInfo | 修改云开发环境别名 |
| manageCollection | 统一的集合管理（创建/检查/描述/列表/更新集合） |
| checkIndexExists | 检查索引是否存在 |
| distribution | 查询数据库中集合的数据分布情况 |
| manageDocuments | 统一的文档管理（插入/查询/更新/删除文档） |
| manageHostingFiles | 统一的静态网站托管文件管理（上传/列表/删除/搜索文件） |
| domainManagement | 统一的域名管理工具，支持绑定、解绑、查询和修改域名配置 |
| getWebsiteConfig | 获取静态网站配置 |
| getFunctionList | 获取云函数列表 |
| manageFunction | 统一的函数管理（创建/更新代码/更新配置） |
| getFunctionDetail | 获取云函数详情 |
| invokeFunction | 调用云函数 |
| getFunctionLogs | 获取云函数日志 |
| manageFunctionTriggers | 统一的函数触发器管理（创建/删除触发器） |
| uploadFile | 上传文件到云存储（适合存储业务数据文件） |
| manageTempFile | 统一的临时文件管理（创建/读取文件） |
| downloadRemoteFile | 下载远程文件到本地临时文件 |
| searchKnowledgeBase | 智能检索云开发知识库（支持云开发与云函数），通过向量搜索快速获取专业文档与答案。|
| interactiveDialog | 统一的交互式对话工具，支持需求澄清和任务确认 |

## 使用方式

这些工具会在你与 AI 对话时自动调用，无需手动执行。例如：

- 当你说"登录云开发"时，AI 会调用 `login` 工具
- 当你说"查询环境信息"时，AI 会调用 `getEnvInfo` 工具
- 当你说"部署应用"时，AI 会调用相关的部署工具

## 配置说明

MCP 工具通过以下配置添加到你的 AI IDE 中：

```json
{
  "mcpServers": {
    "cloudbase-mcp": {
      "command": "npx",
      "args": ["-y", "@cloudbase/cloudbase-mcp@latest"]
    }
  }
}
``` 