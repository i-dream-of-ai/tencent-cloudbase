import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { wrapServerWithTelemetry } from "./utils/tool-wrapper.js";
import { CloudBaseOptions } from "./types.js";
import { 
  createPluginManager, 
  createBuiltinPluginRegistry, 
  loadPluginConfig,
  PluginConfig,
  PluginManager
} from "./plugin-system/index.js";

// 扩展 McpServer 类型以包含 cloudBaseOptions 和插件管理器
export interface ExtendedMcpServer extends McpServer {
  cloudBaseOptions?: CloudBaseOptions;
  pluginManager?: PluginManager;
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
  pluginConfig?: PluginConfig;
}): ExtendedMcpServer {
  const {
    name = "cloudbase-mcp",
    version = "1.0.0",
    enableTelemetry = true,
    cloudBaseOptions,
    pluginConfig
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

  // Initialize plugin system
  const config = pluginConfig || loadPluginConfig();
  const pluginManager = createPluginManager(server, config);
  
  // Register built-in plugins
  const builtinRegistry = createBuiltinPluginRegistry();
  builtinRegistry.getPlugins().forEach(plugin => {
    pluginManager.registerPlugin(plugin);
  });

  // Load plugins based on configuration
  pluginManager.loadPlugins();

  // Store plugin manager in server instance
  server.pluginManager = pluginManager;

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