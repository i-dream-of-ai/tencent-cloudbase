import { PluginConfig } from './types.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { warn, info } from '../utils/logger.js';

/**
 * Configuration sources
 */
export enum ConfigSource {
  ENVIRONMENT = 'environment',
  CONFIG_FILE = 'config-file',
  PACKAGE_JSON = 'package-json',
  DEFAULT = 'default'
}

/**
 * Configuration loader options
 */
export interface ConfigLoaderOptions {
  configPath?: string;
  environmentPrefix?: string;
  packageJsonPath?: string;
}

/**
 * Plugin configuration loader
 */
export class PluginConfigLoader {
  private options: ConfigLoaderOptions;

  constructor(options: ConfigLoaderOptions = {}) {
    this.options = {
      configPath: options.configPath || 'mcp-plugins.json',
      environmentPrefix: options.environmentPrefix || 'MCP_PLUGIN_',
      packageJsonPath: options.packageJsonPath || 'package.json'
    };
  }

  /**
   * Load plugin configuration from various sources
   */
  loadConfig(): PluginConfig {
    const config: PluginConfig = this.getDefaultConfig();

    // Load from config file
    this.loadFromConfigFile(config);

    // Load from package.json
    this.loadFromPackageJson(config);

    // Load from environment variables
    this.loadFromEnvironment(config);

    // Validate configuration
    this.validateConfig(config);

    return config;
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): PluginConfig {
    return {
      enabled: ['*'],
      disabled: [],
      maxTools: 40,
      priority: {},
      pluginConfigs: {}
    };
  }

  /**
   * Load configuration from config file
   */
  private loadFromConfigFile(config: PluginConfig): void {
    if (!this.options.configPath) return;

    try {
      if (existsSync(this.options.configPath)) {
        const fileContent = readFileSync(this.options.configPath, 'utf-8');
        const fileConfig = JSON.parse(fileContent);
        
        this.mergeConfig(config, fileConfig);
        info(`Loaded plugin configuration from ${this.options.configPath}`);
      }
    } catch (error) {
      warn(`Failed to load plugin configuration from ${this.options.configPath}: ${error}`);
    }
  }

  /**
   * Load configuration from package.json
   */
  private loadFromPackageJson(config: PluginConfig): void {
    if (!this.options.packageJsonPath) return;

    try {
      if (existsSync(this.options.packageJsonPath)) {
        const packageJson = JSON.parse(readFileSync(this.options.packageJsonPath, 'utf-8'));
        
        if (packageJson.mcpPlugins) {
          this.mergeConfig(config, packageJson.mcpPlugins);
          info(`Loaded plugin configuration from ${this.options.packageJsonPath}`);
        }
      }
    } catch (error) {
      warn(`Failed to load plugin configuration from ${this.options.packageJsonPath}: ${error}`);
    }
  }

  /**
   * Load configuration from environment variables
   */
  private loadFromEnvironment(config: PluginConfig): void {
    const prefix = this.options.environmentPrefix!;

    // Check for enabled plugins
    const enabledEnv = process.env[`${prefix}ENABLED`];
    if (enabledEnv) {
      config.enabled = enabledEnv.split(',').map(s => s.trim()).filter(s => s);
      info(`Loaded enabled plugins from environment: ${config.enabled.join(', ')}`);
    }

    // Check for disabled plugins
    const disabledEnv = process.env[`${prefix}DISABLED`];
    if (disabledEnv) {
      config.disabled = disabledEnv.split(',').map(s => s.trim()).filter(s => s);
      info(`Loaded disabled plugins from environment: ${config.disabled.join(', ')}`);
    }

    // Check for max tools
    const maxToolsEnv = process.env[`${prefix}MAX_TOOLS`];
    if (maxToolsEnv) {
      const maxTools = parseInt(maxToolsEnv, 10);
      if (!isNaN(maxTools) && maxTools > 0) {
        config.maxTools = maxTools;
        info(`Loaded max tools from environment: ${maxTools}`);
      }
    }

    // Check for priority overrides
    Object.keys(process.env).forEach(key => {
      if (key.startsWith(`${prefix}PRIORITY_`)) {
        const pluginName = key.substring(`${prefix}PRIORITY_`.length).toLowerCase();
        const priority = parseInt(process.env[key]!, 10);
        
        if (!isNaN(priority)) {
          config.priority = config.priority || {};
          config.priority[pluginName] = priority;
          info(`Loaded priority override from environment: ${pluginName} = ${priority}`);
        }
      }
    });
  }

  /**
   * Merge configuration objects
   */
  private mergeConfig(target: PluginConfig, source: Partial<PluginConfig>): void {
    if (source.enabled) {
      target.enabled = [...new Set([...target.enabled, ...source.enabled])];
    }

    if (source.disabled) {
      target.disabled = [...new Set([...target.disabled, ...source.disabled])];
    }

    if (source.maxTools !== undefined) {
      target.maxTools = source.maxTools;
    }

    if (source.priority) {
      target.priority = { ...target.priority, ...source.priority };
    }

    if (source.pluginConfigs) {
      target.pluginConfigs = { ...target.pluginConfigs, ...source.pluginConfigs };
    }
  }

  /**
   * Validate configuration
   */
  private validateConfig(config: PluginConfig): void {
    // Ensure enabled is an array
    if (!Array.isArray(config.enabled)) {
      warn('Invalid enabled configuration, using default');
      config.enabled = ['*'];
    }

    // Ensure disabled is an array
    if (!Array.isArray(config.disabled)) {
      warn('Invalid disabled configuration, using default');
      config.disabled = [];
    }

    // Ensure maxTools is a positive number
    if (config.maxTools !== undefined && (typeof config.maxTools !== 'number' || config.maxTools <= 0)) {
      warn('Invalid maxTools configuration, using default');
      config.maxTools = 40;
    }

    // Ensure priority is an object
    if (config.priority && typeof config.priority !== 'object') {
      warn('Invalid priority configuration, using default');
      config.priority = {};
    }

    // Ensure pluginConfigs is an object
    if (config.pluginConfigs && typeof config.pluginConfigs !== 'object') {
      warn('Invalid pluginConfigs configuration, using default');
      config.pluginConfigs = {};
    }
  }
}

/**
 * Create and return a plugin configuration loader
 */
export function createConfigLoader(options?: ConfigLoaderOptions): PluginConfigLoader {
  return new PluginConfigLoader(options);
}

/**
 * Load plugin configuration with default options
 */
export function loadPluginConfig(options?: ConfigLoaderOptions): PluginConfig {
  const loader = createConfigLoader(options);
  return loader.loadConfig();
}