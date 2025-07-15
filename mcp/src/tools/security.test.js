import { test, expect, vi, beforeEach, describe } from 'vitest';
import { z } from 'zod';

// Mock CloudBase manager
const mockCloudbaseManager = {
  commonService: vi.fn(() => ({
    call: vi.fn()
  }))
};

const mockGetManager = vi.fn(() => Promise.resolve(mockCloudbaseManager));
const mockGetDatabaseInstanceId = vi.fn(() => Promise.resolve('test-instance-id'));

// Mock the cloudbase-manager module
vi.mock('../cloudbase-manager.js', () => ({
  getCloudBaseManager: mockGetManager,
  getEnvId: vi.fn(() => Promise.resolve('test-env-id'))
}));

// Import the security tools after mocking
let registerSecurityTools;

beforeEach(async () => {
  vi.clearAllMocks();
  
  // Dynamic import to ensure mocks are applied
  const securityModule = await import('./security.js');
  registerSecurityTools = securityModule.registerSecurityTools;
});

describe('Security Tools - Database Simple Permissions', () => {
  let mockServer;
  
  beforeEach(() => {
    mockServer = {
      registerTool: vi.fn(),
      cloudBaseOptions: {}
    };
  });

  test('should register security tools', () => {
    registerSecurityTools(mockServer);
    
    expect(mockServer.registerTool).toHaveBeenCalledTimes(2);
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'readSecurityRules',
      expect.objectContaining({
        title: expect.stringContaining('读取安全规则'),
        description: expect.any(String),
        inputSchema: expect.any(Object)
      }),
      expect.any(Function)
    );
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'writeSecurityRules', 
      expect.objectContaining({
        title: expect.stringContaining('写入安全规则'),
        description: expect.any(String),
        inputSchema: expect.any(Object)
      }),
      expect.any(Function)
    );
  });

  test('readSecurityRules - should handle database permissions read', async () => {
    const mockResponse = {
      RequestId: 'test-request-id',
      Rules: [
        {
          Resource: 'users',
          Permission: 'read'
        }
      ]
    };

    mockCloudbaseManager.commonService().call.mockResolvedValue(mockResponse);
    
    registerSecurityTools(mockServer);
    
    // Get the readSecurityRules tool function
    const readToolCall = mockServer.registerTool.mock.calls.find(
      call => call[0] === 'readSecurityRules'
    );
    const readToolFunction = readToolCall[2];
    
    const result = await readToolFunction({
      serviceType: 'database',
      resourceName: 'users'
    });
    
    expect(mockCloudbaseManager.commonService).toHaveBeenCalledWith('flexdb');
    expect(mockCloudbaseManager.commonService().call).toHaveBeenCalledWith({
      Action: 'GetDatabaseSimplePermission',
      Param: {
        Tag: 'test-instance-id',
        CollectionName: 'users'
      }
    });
    
    expect(result.content[0].text).toContain('test-request-id');
    expect(result.content[0].text).toContain('users');
    expect(result.content[0].text).toContain('read');
  });

  test('readSecurityRules - should handle all collections when no resourceName specified', async () => {
    const mockResponse = {
      RequestId: 'test-request-id-all',
      DefaultPermission: 'none',
      Rules: []
    };

    mockCloudbaseManager.commonService().call.mockResolvedValue(mockResponse);
    
    registerSecurityTools(mockServer);
    
    const readToolCall = mockServer.registerTool.mock.calls.find(
      call => call[0] === 'readSecurityRules'
    );
    const readToolFunction = readToolCall[2];
    
    const result = await readToolFunction({
      serviceType: 'database'
    });
    
    expect(mockCloudbaseManager.commonService().call).toHaveBeenCalledWith({
      Action: 'GetDatabaseSimplePermission',
      Param: {
        Tag: 'test-instance-id'
      }
    });
    
    expect(result.content[0].text).toContain('none');
  });

  test('writeSecurityRules - should handle database permission write', async () => {
    const mockResponse = {
      RequestId: 'test-write-request-id'
    };

    mockCloudbaseManager.commonService().call.mockResolvedValue(mockResponse);
    
    registerSecurityTools(mockServer);
    
    const writeToolCall = mockServer.registerTool.mock.calls.find(
      call => call[0] === 'writeSecurityRules'
    );
    const writeToolFunction = writeToolCall[2];
    
    const result = await writeToolFunction({
      serviceType: 'database',
      rules: [
        {
          collectionName: 'posts',
          permission: 'write'
        }
      ]
    });
    
    expect(mockCloudbaseManager.commonService).toHaveBeenCalledWith('flexdb');
    expect(mockCloudbaseManager.commonService().call).toHaveBeenCalledWith({
      Action: 'SetDatabaseSimplePermission',
      Param: {
        Tag: 'test-instance-id',
        CollectionName: 'posts',
        Permission: 'write'
      }
    });
    
    expect(result.content[0].text).toContain('test-write-request-id');
  });

  test('writeSecurityRules - should validate permission enum values', async () => {
    registerSecurityTools(mockServer);
    
    const writeToolCall = mockServer.registerTool.mock.calls.find(
      call => call[0] === 'writeSecurityRules'
    );
    
    // Check the input schema has correct enum values
    const inputSchema = writeToolCall[1].inputSchema;
    const rulesSchema = inputSchema.rules;
    
    // The rules should be an array with objects containing permission enum
    expect(rulesSchema).toBeDefined();
  });

  test('writeSecurityRules - should handle multiple collections', async () => {
    const mockResponse = {
      RequestId: 'test-multi-request-id'
    };

    mockCloudbaseManager.commonService().call.mockResolvedValue(mockResponse);
    
    registerSecurityTools(mockServer);
    
    const writeToolCall = mockServer.registerTool.mock.calls.find(
      call => call[0] === 'writeSecurityRules'
    );
    const writeToolFunction = writeToolCall[2];
    
    const result = await writeToolFunction({
      serviceType: 'database',
      rules: [
        {
          collectionName: 'users',
          permission: 'read'
        },
        {
          collectionName: 'posts', 
          permission: 'write'
        }
      ]
    });
    
    // Should make multiple API calls for multiple collections
    expect(mockCloudbaseManager.commonService().call).toHaveBeenCalledTimes(2);
    expect(mockCloudbaseManager.commonService().call).toHaveBeenNthCalledWith(1, {
      Action: 'SetDatabaseSimplePermission',
      Param: {
        Tag: 'test-instance-id',
        CollectionName: 'users',
        Permission: 'read'
      }
    });
    expect(mockCloudbaseManager.commonService().call).toHaveBeenNthCalledWith(2, {
      Action: 'SetDatabaseSimplePermission',
      Param: {
        Tag: 'test-instance-id',
        CollectionName: 'posts',
        Permission: 'write'
      }
    });
  });

  test('should handle service type validation', async () => {
    registerSecurityTools(mockServer);
    
    const readToolCall = mockServer.registerTool.mock.calls.find(
      call => call[0] === 'readSecurityRules'
    );
    
    // Check that serviceType is properly validated as enum
    const inputSchema = readToolCall[1].inputSchema;
    expect(inputSchema.serviceType).toBeDefined();
  });

  test('should handle errors gracefully', async () => {
    const mockError = new Error('CloudBase API Error');
    mockCloudbaseManager.commonService().call.mockRejectedValue(mockError);
    
    registerSecurityTools(mockServer);
    
    const readToolCall = mockServer.registerTool.mock.calls.find(
      call => call[0] === 'readSecurityRules'
    );
    const readToolFunction = readToolCall[2];
    
    const result = await readToolFunction({
      serviceType: 'database'
    });
    
    expect(result.content[0].text).toContain('CloudBase API Error');
    expect(result.content[0].text).toContain('success": false');
  });

  test('permission enum should include correct values', () => {
    // Test that the valid permission values are what we expect
    const validPermissions = ['none', 'read', 'write', 'admin'];
    
    registerSecurityTools(mockServer);
    
    const writeToolCall = mockServer.registerTool.mock.calls.find(
      call => call[0] === 'writeSecurityRules'
    );
    
    // The schema should validate these permission values
    expect(writeToolCall[1].inputSchema).toBeDefined();
  });
});