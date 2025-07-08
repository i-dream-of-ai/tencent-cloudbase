import { ExtendedMcpServer } from '../server.js';
import { McpPlugin, PluginConfig, PluginManager, PluginMetadata } from './types.js';
import { info, warn, error } from '../utils/logger.js';

/**
 * Default plugin configuration
 */
const DEFAULT_CONFIG: PluginConfig = {
  enabled: ['*'], // Enable all plugins by default
  disabled: [],
  maxTools: 40
};

/**
 * Plugin Manager implementation
 */
export class CloudBasePluginManager implements PluginManager {
  private plugins: Map<string, McpPlugin> = new Map();
  private loadedPlugins: Set<string> = new Set();
  private server: ExtendedMcpServer;
  private config: PluginConfig;
  private toolCount: number = 0;

  constructor(server: ExtendedMcpServer, config: PluginConfig = DEFAULT_CONFIG) {
    this.server = server;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Register a plugin with the manager
   */
  registerPlugin(plugin: McpPlugin): void {
    if (this.plugins.has(plugin.name)) {
      warn(`Plugin ${plugin.name} is already registered, skipping`);
      return;
    }

    // Validate plugin structure
    if (!this.validatePlugin(plugin)) {
      error(`Plugin ${plugin.name} failed validation`);
      return;
    }

    this.plugins.set(plugin.name, plugin);
    info(`Registered plugin: ${plugin.name} v${plugin.version}`);
  }

  /**
   * Load plugins based on configuration
   */
  loadPlugins(config?: PluginConfig): void {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Clear previously loaded plugins
    this.loadedPlugins.clear();
    this.toolCount = 0;

    // Get plugins to load in priority order
    const pluginsToLoad = this.getPluginsToLoad();
    
    // Load plugins with dependency resolution
    this.loadPluginsWithDependencies(pluginsToLoad);
  }

  /**
   * Get list of registered plugins
   */
  getPlugins(): McpPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get list of loaded plugins
   */
  getLoadedPlugins(): McpPlugin[] {
    return Array.from(this.loadedPlugins)
      .map(name => this.plugins.get(name))
      .filter(plugin => plugin !== undefined) as McpPlugin[];
  }

  /**
   * Check if a plugin is loaded
   */
  isPluginLoaded(name: string): boolean {
    return this.loadedPlugins.has(name);
  }

  /**
   * Get plugin by name
   */
  getPlugin(name: string): McpPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get total number of registered tools
   */
  getToolCount(): number {
    return this.toolCount;
  }

  /**
   * Get plugin metadata for discovery
   */
  getPluginMetadata(): PluginMetadata[] {
    return Array.from(this.plugins.values()).map(plugin => ({
      name: plugin.name,
      version: plugin.version,
      description: plugin.description,
      category: plugin.category,
      toolCount: plugin.getToolList?.().length || 0
    }));
  }

  /**
   * Validate plugin structure
   */
  private validatePlugin(plugin: McpPlugin): boolean {
    const requiredFields = ['name', 'version', 'description', 'category', 'priority', 'register'];
    
    for (const field of requiredFields) {
      if (!(field in plugin)) {
        error(`Plugin validation failed: missing required field '${field}'`);
        return false;
      }
    }

    if (typeof plugin.register !== 'function') {
      error(`Plugin validation failed: 'register' must be a function`);
      return false;
    }

    return true;
  }

  /**
   * Determine which plugins to load based on configuration
   */
  private getPluginsToLoad(): McpPlugin[] {
    const allPlugins = Array.from(this.plugins.values());
    
    // Filter plugins based on enabled/disabled lists
    const enabledPlugins = allPlugins.filter(plugin => {
      // Check if explicitly disabled
      if (this.config.disabled.includes(plugin.name)) {
        return false;
      }

      // Check if explicitly enabled or if '*' is in enabled list
      if (this.config.enabled.includes('*') || this.config.enabled.includes(plugin.name)) {
        return true;
      }

      // Check if plugin has custom isEnabled function
      if (plugin.isEnabled) {
        return plugin.isEnabled();
      }

      return false;
    });

    // Apply priority overrides from config
    enabledPlugins.forEach(plugin => {
      if (this.config.priority?.[plugin.name] !== undefined) {
        plugin.priority = this.config.priority[plugin.name];
      }
    });

    // Sort by priority (higher priority first)
    return enabledPlugins.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Load plugins with dependency resolution
   */
  private loadPluginsWithDependencies(plugins: McpPlugin[]): void {
    const loadedSet = new Set<string>();
    const loadingStack: string[] = [];

    const loadPlugin = (plugin: McpPlugin): boolean => {
      // Check if already loaded
      if (loadedSet.has(plugin.name)) {
        return true;
      }

      // Check for circular dependencies
      if (loadingStack.includes(plugin.name)) {
        error(`Circular dependency detected: ${loadingStack.join(' -> ')} -> ${plugin.name}`);
        return false;
      }

      // Load dependencies first
      if (plugin.dependencies) {
        loadingStack.push(plugin.name);
        
        for (const depName of plugin.dependencies) {
          const depPlugin = this.plugins.get(depName);
          if (!depPlugin) {
            error(`Plugin ${plugin.name} depends on missing plugin: ${depName}`);
            loadingStack.pop();
            return false;
          }
          
          if (!loadPlugin(depPlugin)) {
            error(`Failed to load dependency ${depName} for plugin ${plugin.name}`);
            loadingStack.pop();
            return false;
          }
        }
        
        loadingStack.pop();
      }

      // Check tool count limit
      const pluginToolCount = plugin.getToolList?.().length || 0;
      if (this.config.maxTools && this.toolCount + pluginToolCount > this.config.maxTools) {
        warn(`Skipping plugin ${plugin.name}: would exceed max tools limit (${this.config.maxTools})`);
        return false;
      }

      // Load the plugin
      try {
        plugin.register(this.server);
        loadedSet.add(plugin.name);
        this.loadedPlugins.add(plugin.name);
        this.toolCount += pluginToolCount;
        
        info(`Loaded plugin: ${plugin.name} (${pluginToolCount} tools)`);
        return true;
      } catch (err) {
        error(`Failed to load plugin ${plugin.name}: ${err instanceof Error ? err.message : String(err)}`);
        return false;
      }
    };

    // Load all plugins
    plugins.forEach(plugin => {
      loadPlugin(plugin);
    });

    info(`Plugin loading complete: ${this.loadedPlugins.size} plugins loaded, ${this.toolCount} tools registered`);
  }

  /**
   * Unload a plugin (if supported)
   */
  unloadPlugin(name: string): boolean {
    const plugin = this.plugins.get(name);
    if (!plugin || !this.loadedPlugins.has(name)) {
      return false;
    }

    try {
      if (plugin.cleanup) {
        plugin.cleanup();
      }
      
      this.loadedPlugins.delete(name);
      
      // Recalculate tool count
      this.toolCount = this.getLoadedPlugins()
        .reduce((count, p) => count + (p.getToolList?.().length || 0), 0);
      
      info(`Unloaded plugin: ${name}`);
      return true;
    } catch (err) {
      error(`Failed to unload plugin ${name}: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }
}

/**
 * Create a plugin manager instance
 */
export function createPluginManager(server: ExtendedMcpServer, config?: PluginConfig): PluginManager {
  return new CloudBasePluginManager(server, config);
}