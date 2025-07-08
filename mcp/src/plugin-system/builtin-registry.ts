import { McpPlugin } from './types.js';
import { createPlugin, PLUGIN_CATEGORIES, getDefaultPriority } from './plugin-factory.js';

// Import existing tool registration functions
import { registerEnvTools } from '../tools/env.js';
import { registerFileTools } from '../tools/file.js';
import { registerFunctionTools } from '../tools/functions.js';
import { registerDatabaseTools } from '../tools/database.js';
import { registerHostingTools } from '../tools/hosting.js';
import { registerDownloadTools } from '../tools/download.js';
import { registerStorageTools } from '../tools/storage.js';
import { registerRagTools } from '../tools/rag.js';
import { registerSetupTools } from '../tools/setup.js';
import { registerInteractiveTools } from '../tools/interactive.js';
import { registerGatewayTools } from '../tools/gateway.js';

/**
 * Built-in plugin registry
 * This provides backward compatibility with existing tool registration functions
 */
export class BuiltinPluginRegistry {
  private plugins: Map<string, McpPlugin> = new Map();

  constructor() {
    this.registerBuiltinPlugins();
  }

  /**
   * Register all built-in plugins
   */
  private registerBuiltinPlugins(): void {
    // Environment tools plugin
    this.registerPlugin(createPlugin(registerEnvTools, {
      name: 'env',
      version: '1.0.0',
      description: 'Environment management tools for CloudBase login, logout, and environment queries',
      category: PLUGIN_CATEGORIES.ENV,
      priority: getDefaultPriority(PLUGIN_CATEGORIES.ENV),
      toolNames: ['login', 'logout', 'envQuery']
    }));

    // Database tools plugin
    this.registerPlugin(createPlugin(registerDatabaseTools, {
      name: 'database',
      version: '1.0.0',
      description: 'Database management tools for CloudBase collections, indexes, and data models',
      category: PLUGIN_CATEGORIES.DATABASE,
      priority: getDefaultPriority(PLUGIN_CATEGORIES.DATABASE),
      dependencies: ['env'],
      toolNames: [
        'createCollection', 'getCollection', 'updateCollection', 'deleteCollection',
        'createIndex', 'deleteIndex', 'getDataModel', 'createDataModel', 
        'updateDataModel', 'deleteDataModel', 'listDataModels', 'manageDataModel'
      ]
    }));

    // Functions tools plugin
    this.registerPlugin(createPlugin(registerFunctionTools, {
      name: 'functions',
      version: '1.0.0',
      description: 'Cloud functions management tools for creating, updating, and monitoring functions',
      category: PLUGIN_CATEGORIES.FUNCTIONS,
      priority: getDefaultPriority(PLUGIN_CATEGORIES.FUNCTIONS),
      dependencies: ['env'],
      toolNames: [
        'getFunctionList', 'createFunction', 'updateFunctionCode', 'getFunctionLogs',
        'invokeFunction', 'deleteFunctionTrigger', 'getFunctionTrigger', 
        'createFunctionTrigger', 'updateFunctionTrigger'
      ]
    }));

    // Hosting tools plugin
    this.registerPlugin(createPlugin(registerHostingTools, {
      name: 'hosting',
      version: '1.0.0',
      description: 'Static website hosting tools for deploying and managing web applications',
      category: PLUGIN_CATEGORIES.HOSTING,
      priority: getDefaultPriority(PLUGIN_CATEGORIES.HOSTING),
      dependencies: ['env'],
      toolNames: [
        'uploadFiles', 'deleteFiles', 'listFiles', 'getWebsiteConfig',
        'createWebsiteConfig', 'updateWebsiteConfig'
      ]
    }));

    // Storage tools plugin
    this.registerPlugin(createPlugin(registerStorageTools, {
      name: 'storage',
      version: '1.0.0',
      description: 'Cloud storage tools for file upload, download, and management',
      category: PLUGIN_CATEGORIES.STORAGE,
      priority: getDefaultPriority(PLUGIN_CATEGORIES.STORAGE),
      dependencies: ['env'],
      toolNames: [
        'uploadFile', 'downloadFile', 'deleteFile', 'listFiles', 'getFileInfo',
        'getTempFileURL', 'batchUploadFiles', 'batchDeleteFiles'
      ]
    }));

    // Download tools plugin
    this.registerPlugin(createPlugin(registerDownloadTools, {
      name: 'download',
      version: '1.0.0',
      description: 'Remote file download tools for fetching external resources',
      category: PLUGIN_CATEGORIES.DOWNLOAD,
      priority: getDefaultPriority(PLUGIN_CATEGORIES.DOWNLOAD),
      toolNames: ['downloadRemoteFile', 'downloadTemplate', 'downloadGithubRepo']
    }));

    // RAG tools plugin
    this.registerPlugin(createPlugin(registerRagTools, {
      name: 'rag',
      version: '1.0.0',
      description: 'Knowledge base and RAG (Retrieval-Augmented Generation) tools',
      category: PLUGIN_CATEGORIES.RAG,
      priority: getDefaultPriority(PLUGIN_CATEGORIES.RAG),
      dependencies: ['env'],
      toolNames: ['searchKnowledgeBase', 'addToKnowledgeBase', 'listKnowledgeBase']
    }));

    // Setup tools plugin
    this.registerPlugin(createPlugin(registerSetupTools, {
      name: 'setup',
      version: '1.0.0',
      description: 'CloudBase setup and initialization tools',
      category: PLUGIN_CATEGORIES.SETUP,
      priority: getDefaultPriority(PLUGIN_CATEGORIES.SETUP),
      dependencies: ['env'],
      toolNames: ['initProject', 'deployProject', 'checkStatus']
    }));

    // Interactive tools plugin
    this.registerPlugin(createPlugin(registerInteractiveTools, {
      name: 'interactive',
      version: '1.0.0',
      description: 'Interactive tools for user input and confirmation dialogs',
      category: PLUGIN_CATEGORIES.INTERACTIVE,
      priority: getDefaultPriority(PLUGIN_CATEGORIES.INTERACTIVE),
      toolNames: ['interactiveDialog', 'confirmAction']
    }));

    // Gateway tools plugin
    this.registerPlugin(createPlugin(registerGatewayTools, {
      name: 'gateway',
      version: '1.0.0',
      description: 'API Gateway management tools for CloudBase',
      category: PLUGIN_CATEGORIES.GATEWAY,
      priority: getDefaultPriority(PLUGIN_CATEGORIES.GATEWAY),
      dependencies: ['env'],
      toolNames: ['createGateway', 'updateGateway', 'deleteGateway', 'listGateways']
    }));

    // File tools plugin (currently commented out in server.ts)
    this.registerPlugin(createPlugin(registerFileTools, {
      name: 'file',
      version: '1.0.0',
      description: 'Local file system tools for reading and writing files',
      category: PLUGIN_CATEGORIES.CORE,
      priority: getDefaultPriority(PLUGIN_CATEGORIES.CORE),
      toolNames: ['readFile', 'writeFile', 'listFiles', 'deleteFile']
    }));
  }

  /**
   * Register a plugin
   */
  private registerPlugin(plugin: McpPlugin): void {
    this.plugins.set(plugin.name, plugin);
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): McpPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugin by name
   */
  getPlugin(name: string): McpPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get plugins by category
   */
  getPluginsByCategory(category: string): McpPlugin[] {
    return Array.from(this.plugins.values())
      .filter(plugin => plugin.category === category);
  }

  /**
   * Get plugin names
   */
  getPluginNames(): string[] {
    return Array.from(this.plugins.keys());
  }
}

/**
 * Create and return the built-in plugin registry
 */
export function createBuiltinPluginRegistry(): BuiltinPluginRegistry {
  return new BuiltinPluginRegistry();
}