import { ExtendedMcpServer } from '../server.js';

/**
 * Plugin interface that all MCP plugins must implement
 */
export interface McpPlugin {
  /** Plugin name (must be unique) */
  name: string;
  
  /** Plugin version */
  version: string;
  
  /** Plugin description */
  description: string;
  
  /** Plugin category (e.g., 'database', 'hosting', 'functions') */
  category: string;
  
  /** Plugin priority (higher numbers load first) */
  priority: number;
  
  /** Plugin dependencies (other plugin names that must be loaded first) */
  dependencies?: string[];
  
  /** Function to register tools with the MCP server */
  register: (server: ExtendedMcpServer) => void;
  
  /** Optional function to get list of tool names this plugin provides */
  getToolList?: () => string[];
  
  /** Optional function to check if plugin should be enabled */
  isEnabled?: () => boolean;
  
  /** Optional cleanup function called when plugin is disabled */
  cleanup?: () => void;
}

/**
 * Plugin configuration interface
 */
export interface PluginConfig {
  /** List of enabled plugin names */
  enabled: string[];
  
  /** List of disabled plugin names */
  disabled: string[];
  
  /** Maximum number of tools to register (default: 40) */
  maxTools?: number;
  
  /** Custom priority overrides for plugins */
  priority?: Record<string, number>;
  
  /** Plugin-specific configuration */
  pluginConfigs?: Record<string, any>;
}

/**
 * Plugin manager interface
 */
export interface PluginManager {
  /** Register a plugin */
  registerPlugin(plugin: McpPlugin): void;
  
  /** Load plugins based on configuration */
  loadPlugins(config: PluginConfig): void;
  
  /** Get list of registered plugins */
  getPlugins(): McpPlugin[];
  
  /** Get list of loaded plugins */
  getLoadedPlugins(): McpPlugin[];
  
  /** Check if a plugin is loaded */
  isPluginLoaded(name: string): boolean;
  
  /** Get plugin by name */
  getPlugin(name: string): McpPlugin | undefined;
  
  /** Get total number of registered tools */
  getToolCount(): number;
}

/**
 * Plugin metadata for discovery
 */
export interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  category: string;
  author?: string;
  homepage?: string;
  keywords?: string[];
  toolCount?: number;
}