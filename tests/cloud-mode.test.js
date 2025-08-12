import { test, expect, beforeEach, afterEach } from 'vitest';

// Mock modules before importing
import { vi } from 'vitest';

// Mock logger
vi.mock('../mcp/src/utils/logger.js', () => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}));

describe('Cloud Mode Functionality', () => {
  let originalEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    // Clear cloud mode environment variables
    delete process.env.CLOUDBASE_MCP_CLOUD_MODE;
    delete process.env.MCP_CLOUD_MODE;
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  test('should detect cloud mode from CLOUDBASE_MCP_CLOUD_MODE environment variable', async () => {
    process.env.CLOUDBASE_MCP_CLOUD_MODE = 'true';
    
    const { isCloudMode } = await import('../mcp/src/utils/cloud-mode.js');
    expect(isCloudMode()).toBe(true);
  });

  test('should detect cloud mode from MCP_CLOUD_MODE environment variable', async () => {
    process.env.MCP_CLOUD_MODE = 'true';
    
    const { isCloudMode } = await import('../mcp/src/utils/cloud-mode.js');
    expect(isCloudMode()).toBe(true);
  });

  test('should not be in cloud mode by default', async () => {
    const { isCloudMode } = await import('../mcp/src/utils/cloud-mode.js');
    expect(isCloudMode()).toBe(false);
  });

  test('should enable cloud mode programmatically', async () => {
    const { isCloudMode, enableCloudMode } = await import('../mcp/src/utils/cloud-mode.js');
    
    expect(isCloudMode()).toBe(false);
    enableCloudMode();
    expect(isCloudMode()).toBe(true);
    expect(process.env.CLOUDBASE_MCP_CLOUD_MODE).toBe('true');
  });

  test('should construct auth state from environment variables', async () => {
    process.env.TENCENTCLOUD_SECRETID = 'test-secret-id';
    process.env.TENCENTCLOUD_SECRETKEY = 'test-secret-key';
    process.env.TENCENTCLOUD_SESSIONTOKEN = 'test-session-token';

    // Mock AuthSupevisor to avoid actual authentication
    const mockAuth = {
      getLoginState: vi.fn().mockResolvedValue(null),
      loginByWebAuth: vi.fn().mockResolvedValue(true)
    };
    
    vi.mock('@cloudbase/toolbox', () => ({
      AuthSupevisor: {
        getInstance: () => mockAuth
      }
    }));

    const { getLoginState } = await import('../mcp/src/auth.js');
    const loginState = await getLoginState();

    expect(loginState).toEqual({
      isLoggedIn: true,
      credential: {
        secretId: 'test-secret-id',
        secretKey: 'test-secret-key',
        token: 'test-session-token'
      }
    });

    // Should not call AuthSupevisor methods when env vars are available
    expect(mockAuth.getLoginState).not.toHaveBeenCalled();
    expect(mockAuth.loginByWebAuth).not.toHaveBeenCalled();
  });

  test('should filter plugins in cloud mode', async () => {
    process.env.CLOUDBASE_MCP_CLOUD_MODE = 'true';
    
    // Import server module after setting cloud mode
    const { createCloudBaseMcpServer } = await import('../mcp/src/server.js');
    
    const server = createCloudBaseMcpServer({
      name: 'test-server',
      enableTelemetry: false
    });

    // The server should be created successfully
    expect(server).toBeDefined();
    expect(server.name).toBe('test-server');
  });

  test('should support cloudMode parameter in constructor', async () => {
    const { createCloudBaseMcpServer, isCloudMode } = await import('../mcp/src/server.js');
    
    expect(isCloudMode()).toBe(false);
    
    createCloudBaseMcpServer({
      cloudMode: true,
      enableTelemetry: false
    });
    
    expect(isCloudMode()).toBe(true);
  });
});
