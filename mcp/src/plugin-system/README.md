# CloudBase MCP Plugin System

The CloudBase MCP Plugin System provides a flexible, pluggable architecture for managing MCP tools. It allows you to:

- Enable/disable specific tool categories on demand
- Control tool loading order and dependencies
- Manage tool count limits to work within MCP client constraints
- Add custom plugins without modifying core code

## Quick Start

### Basic Usage

```typescript
import { createCloudBaseMcpServer } from '@cloudbase/cloudbase-mcp';

// Create server with default plugin configuration
const server = createCloudBaseMcpServer();

// Create server with custom plugin configuration
const server = createCloudBaseMcpServer({
  pluginConfig: {
    enabled: ['env', 'database', 'functions'],
    disabled: ['rag'],
    maxTools: 30
  }
});
```

### Configuration Options

#### Environment Variables

```bash
# Enable only specific plugins
export MCP_PLUGIN_ENABLED="env,database,functions"

# Disable specific plugins
export MCP_PLUGIN_DISABLED="rag,gateway"

# Set maximum tool count
export MCP_PLUGIN_MAX_TOOLS=30

# Set plugin priorities
export MCP_PLUGIN_PRIORITY_ENV=100
export MCP_PLUGIN_PRIORITY_DATABASE=90
```

#### Configuration File (mcp-plugins.json)

```json
{
  "enabled": ["env", "database", "functions", "hosting"],
  "disabled": ["rag", "gateway"],
  "maxTools": 35,
  "priority": {
    "env": 100,
    "database": 90,
    "functions": 80
  },
  "pluginConfigs": {
    "database": {
      "enableIndexes": true
    }
  }
}
```

#### Package.json Configuration

```json
{
  "name": "my-app",
  "mcpPlugins": {
    "enabled": ["env", "database", "functions"],
    "maxTools": 30
  }
}
```

## Built-in Plugins

| Plugin | Category | Tools Count | Description |
|--------|----------|-------------|-------------|
| env | env | 3 | Environment management (login, logout, envQuery) |
| database | database | 12 | Database collections, indexes, and data models |
| functions | functions | 9 | Cloud functions management |
| hosting | hosting | 6 | Static website hosting |
| storage | storage | 8 | Cloud storage management |
| download | download | 3 | Remote file download |
| rag | rag | 3 | Knowledge base and RAG tools |
| setup | setup | 3 | CloudBase setup and initialization |
| interactive | interactive | 2 | Interactive dialogs and confirmations |
| gateway | gateway | 4 | API Gateway management |

## Creating Custom Plugins

### Simple Plugin

```typescript
import { createPlugin, PLUGIN_CATEGORIES } from '@cloudbase/cloudbase-mcp';

const myPlugin = createPlugin(
  (server) => {
    server.registerTool('myTool', {
      title: 'My Custom Tool',
      description: 'A custom tool example',
      inputSchema: {
        message: z.string().describe('Message to process')
      }
    }, async ({ message }) => {
      return {
        content: [{ type: 'text', text: `Processed: ${message}` }]
      };
    });
  },
  {
    name: 'my-plugin',
    version: '1.0.0',
    description: 'My custom plugin',
    category: PLUGIN_CATEGORIES.CORE,
    priority: 50,
    toolNames: ['myTool']
  }
);
```

### Advanced Plugin with Dependencies

```typescript
import { McpPlugin, PLUGIN_CATEGORIES } from '@cloudbase/cloudbase-mcp';

const advancedPlugin: McpPlugin = {
  name: 'advanced-plugin',
  version: '1.0.0',
  description: 'Advanced plugin with dependencies',
  category: PLUGIN_CATEGORIES.DATABASE,
  priority: 60,
  dependencies: ['env', 'database'],
  
  register: (server) => {
    // Register multiple tools
    server.registerTool('advancedTool1', /* ... */);
    server.registerTool('advancedTool2', /* ... */);
  },
  
  getToolList: () => ['advancedTool1', 'advancedTool2'],
  
  isEnabled: () => {
    // Custom logic to determine if plugin should be enabled
    return process.env.NODE_ENV !== 'production';
  },
  
  cleanup: () => {
    // Cleanup resources when plugin is disabled
    console.log('Cleaning up advanced plugin...');
  }
};
```

### Using Custom Plugins

```typescript
import { createCloudBaseMcpServer, createPluginManager } from '@cloudbase/cloudbase-mcp';

const server = createCloudBaseMcpServer();

// Register custom plugin
server.pluginManager?.registerPlugin(myPlugin);

// Load plugins with updated configuration
server.pluginManager?.loadPlugins({
  enabled: ['*'], // Enable all plugins including custom ones
  maxTools: 50
});
```

## Plugin Manager API

### Methods

```typescript
// Register a plugin
pluginManager.registerPlugin(plugin);

// Load plugins with configuration
pluginManager.loadPlugins(config);

// Get all registered plugins
const plugins = pluginManager.getPlugins();

// Get loaded plugins
const loadedPlugins = pluginManager.getLoadedPlugins();

// Check if plugin is loaded
const isLoaded = pluginManager.isPluginLoaded('database');

// Get plugin by name
const plugin = pluginManager.getPlugin('database');

// Get tool count
const toolCount = pluginManager.getToolCount();
```

## Configuration Loading Priority

1. **Default Configuration** - Built-in defaults
2. **package.json** - mcpPlugins section
3. **Configuration File** - mcp-plugins.json
4. **Environment Variables** - MCP_PLUGIN_* variables

Later sources override earlier ones.

## Best Practices

1. **Tool Limits**: Keep within MCP client limits (typically 40 tools)
2. **Dependencies**: Declare plugin dependencies explicitly
3. **Priority**: Use appropriate priorities for loading order
4. **Error Handling**: Implement proper error handling in custom plugins
5. **Cleanup**: Implement cleanup functions for resource management

## Troubleshooting

### Common Issues

1. **Tool count exceeded**: Reduce enabled plugins or increase maxTools
2. **Dependency conflicts**: Check plugin dependencies and loading order
3. **Configuration not loading**: Verify file paths and format
4. **Plugin not registering**: Check plugin validation requirements

### Debug Information

```typescript
// Get plugin metadata
const metadata = pluginManager.getPluginMetadata();
console.log('Available plugins:', metadata);

// Check loaded plugins
const loaded = pluginManager.getLoadedPlugins();
console.log('Loaded plugins:', loaded.map(p => p.name));

// Check tool count
console.log('Total tools:', pluginManager.getToolCount());
```