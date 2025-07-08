// Plugin system types
export type {
  McpPlugin,
  PluginConfig,
  PluginManager,
  PluginMetadata
} from './types.js';

// Plugin manager
export {
  CloudBasePluginManager,
  createPluginManager
} from './plugin-manager.js';

// Plugin factory
export {
  createPlugin,
  createPlugins,
  PLUGIN_CATEGORIES,
  DEFAULT_PRIORITIES,
  getDefaultPriority
} from './plugin-factory.js';

// Built-in plugin registry
export {
  BuiltinPluginRegistry,
  createBuiltinPluginRegistry
} from './builtin-registry.js';

// Configuration loader
export {
  PluginConfigLoader,
  ConfigSource,
  createConfigLoader,
  loadPluginConfig
} from './config-loader.js';

// Re-export for convenience
export type { ConfigLoaderOptions } from './config-loader.js';