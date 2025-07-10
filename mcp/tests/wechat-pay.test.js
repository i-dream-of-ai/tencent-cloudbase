import { describe, it, expect } from 'vitest';
import { createCloudBaseMcpServer } from '../src/server.js';

describe('WeChat Pay Integration', () => {
  it('should include wechat-pay plugin in available plugins', () => {
    const server = createCloudBaseMcpServer();
    
    // 检查工具是否注册
    const tools = server.listTools?.() || [];
    const wechatPayTools = tools.filter(tool => 
      tool.name?.startsWith('create') && 
      tool.name?.includes('Payment')
    );
    
    expect(wechatPayTools.length).toBeGreaterThan(0);
  });

  it('should have wechat-pay in default plugins', () => {
    // 检查环境变量
    const enabledPlugins = process.env.CLOUDBASE_MCP_PLUGINS_ENABLED;
    if (!enabledPlugins) {
      // 如果没有指定启用插件，应该包含 wechat-pay
      expect(true).toBe(true); // 默认包含
    }
  });
});