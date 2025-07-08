import { McpPlugin } from './types.js';
import { ExtendedMcpServer } from '../server.js';

/**
 * Plugin factory configuration
 */
interface PluginFactoryConfig {
  name: string;
  version?: string;
  description?: string;
  category: string;
  priority?: number;
  dependencies?: string[];
  toolNames?: string[];
}

/**
 * Create a plugin from a registration function
 * This provides backward compatibility with existing tool registration functions
 */
export function createPlugin(
  registerFn: (server: ExtendedMcpServer) => void,
  config: PluginFactoryConfig
): McpPlugin {
  const {
    name,
    version = '1.0.0',
    description = `Plugin for ${config.category} tools`,
    category,
    priority = 0,
    dependencies = [],
    toolNames = []
  } = config;

  return {
    name,
    version,
    description,
    category,
    priority,
    dependencies,
    register: registerFn,
    getToolList: () => toolNames,
    isEnabled: () => true
  };
}

/**
 * Create multiple plugins from a plugin definition map
 */
export function createPlugins(
  pluginDefinitions: Record<string, {
    registerFn: (server: ExtendedMcpServer) => void;
    config: PluginFactoryConfig;
  }>
): McpPlugin[] {
  return Object.entries(pluginDefinitions).map(([key, def]) => 
    createPlugin(def.registerFn, { ...def.config, name: def.config.name || key })
  );
}

/**
 * Plugin categories with default priorities
 */
export const PLUGIN_CATEGORIES = {
  CORE: 'core',
  DATABASE: 'database',
  HOSTING: 'hosting',
  FUNCTIONS: 'functions',
  STORAGE: 'storage',
  DOWNLOAD: 'download',
  RAG: 'rag',
  INTERACTIVE: 'interactive',
  SETUP: 'setup',
  GATEWAY: 'gateway',
  ENV: 'env'
} as const;

/**
 * Default plugin priorities
 */
export const DEFAULT_PRIORITIES = {
  [PLUGIN_CATEGORIES.CORE]: 100,
  [PLUGIN_CATEGORIES.ENV]: 90,
  [PLUGIN_CATEGORIES.SETUP]: 80,
  [PLUGIN_CATEGORIES.INTERACTIVE]: 70,
  [PLUGIN_CATEGORIES.DATABASE]: 60,
  [PLUGIN_CATEGORIES.FUNCTIONS]: 50,
  [PLUGIN_CATEGORIES.HOSTING]: 40,
  [PLUGIN_CATEGORIES.STORAGE]: 30,
  [PLUGIN_CATEGORIES.DOWNLOAD]: 20,
  [PLUGIN_CATEGORIES.RAG]: 15,
  [PLUGIN_CATEGORIES.GATEWAY]: 10
} as const;

/**
 * Get default priority for a category
 */
export function getDefaultPriority(category: string): number {
  return DEFAULT_PRIORITIES[category as keyof typeof DEFAULT_PRIORITIES] || 0;
}