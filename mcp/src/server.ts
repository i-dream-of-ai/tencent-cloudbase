import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerEnvTools } from "./tools/env.js";
import { registerFileTools } from "./tools/file.js";
import { registerFunctionTools } from "./tools/functions.js";
import { registerDatabaseTools } from "./tools/database.js";
import { registerHostingTools } from "./tools/hosting.js";
import { registerDownloadTools } from "./tools/download.js";
import { registerStorageTools } from "./tools/storage.js";
import { registerRagTools } from './tools/rag.js';
import { registerSetupTools } from "./tools/setup.js";
import { registerInteractiveTools } from "./tools/interactive.js";
import { wrapServerWithTelemetry } from "./utils/tool-wrapper.js";
import { registerGatewayTools } from "./tools/gateway.js";
import { CloudBaseOptions } from "./types.js";

// 简单的插件系统定义
interface PluginDefinition {
  name: string;
  register: (server: ExtendedMcpServer) => void;
}

// 默认插件列表 - 核心功能插件
const DEFAULT_PLUGINS: PluginDefinition[] = [
  { name: "env", register: registerEnvTools },
  { name: "database", register: registerDatabaseTools },
  { name: "functions", register: registerFunctionTools },
  { name: "hosting", register: registerHostingTools },
  { name: "storage", register: registerStorageTools },
  { name: "setup", register: registerSetupTools },
  { name: "interactive", register: registerInteractiveTools },
];

// 可选插件列表 - 根据需要启用
const OPTIONAL_PLUGINS: PluginDefinition[] = [
  { name: "rag", register: registerRagTools },
  { name: "download", register: registerDownloadTools },
  { name: "gateway", register: registerGatewayTools },
  { name: "file", register: registerFileTools },
];

// 所有可用插件的映射
const ALL_PLUGINS = new Map<string, PluginDefinition>();
[...DEFAULT_PLUGINS, ...OPTIONAL_PLUGINS].forEach(plugin => {
  ALL_PLUGINS.set(plugin.name, plugin);
});

/**
 * 解析环境变量中的插件列表
 * @param envVar 环境变量值，用逗号分隔
 * @returns 插件名称数组
 */
function parsePluginList(envVar: string | undefined): string[] {
  if (!envVar) return [];
  return envVar.split(',').map(name => name.trim()).filter(name => name);
}

/**
 * 获取要启用的插件列表
 * @returns 插件名称数组
 */
function getEnabledPlugins(): string[] {
  // 环境变量：CLOUDBASE_MCP_PLUGINS_ENABLED（启用的插件）
  const enabledEnv = process.env.CLOUDBASE_MCP_PLUGINS_ENABLED;
  if (enabledEnv) {
    return parsePluginList(enabledEnv);
  }

  // 环境变量：CLOUDBASE_MCP_PLUGINS_DISABLED（禁用的插件）
  const disabledEnv = process.env.CLOUDBASE_MCP_PLUGINS_DISABLED;
  if (disabledEnv) {
    const disabledPlugins = parsePluginList(disabledEnv);
    return DEFAULT_PLUGINS.map(p => p.name).filter(name => !disabledPlugins.includes(name));
  }

  // 默认启用所有核心插件
  return DEFAULT_PLUGINS.map(p => p.name);
}

// 扩展 McpServer 类型以包含 cloudBaseOptions 和新的registerTool方法
export interface ExtendedMcpServer extends McpServer {
  cloudBaseOptions?: CloudBaseOptions;
}

/**
 * Create and configure a CloudBase MCP Server instance
 * @param options Server configuration options
 * @returns Configured McpServer instance
 */
export function createCloudBaseMcpServer(options?: {
  name?: string;
  version?: string;
  enableTelemetry?: boolean;
  cloudBaseOptions?: CloudBaseOptions;
}): ExtendedMcpServer {
  const {
    name = "cloudbase-mcp",
    version = "1.0.0",
    enableTelemetry = true,
    cloudBaseOptions
  } = options ?? {};

  // Create server instance
  const server = new McpServer({
    name,
    version,
    capabilities: {
      tools: {},
    },
  }) as ExtendedMcpServer;

  // Store cloudBaseOptions in server instance for tools to access
  if (cloudBaseOptions) {
    server.cloudBaseOptions = cloudBaseOptions;
  }

  // Enable telemetry if requested
  if (enableTelemetry) {
    wrapServerWithTelemetry(server);
  }

  // 使用插件系统注册工具
  const enabledPlugins = getEnabledPlugins();
  
  console.log(`[CloudBase MCP] 启用的插件: ${enabledPlugins.join(', ')}`);
  
  // 注册启用的插件
  enabledPlugins.forEach(pluginName => {
    const plugin = ALL_PLUGINS.get(pluginName);
    if (plugin) {
      plugin.register(server);
    } else {
      console.warn(`[CloudBase MCP] 未找到插件: ${pluginName}`);
    }
  });

  return server;
}

/**
 * Get the default configured CloudBase MCP Server
 */
export function getDefaultServer(): ExtendedMcpServer {
  return createCloudBaseMcpServer();
}

// Re-export types and utilities that might be useful
export type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
export { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
export { telemetryReporter, reportToolkitLifecycle } from "./utils/telemetry.js";
export { info, error, warn } from "./utils/logger.js"; 