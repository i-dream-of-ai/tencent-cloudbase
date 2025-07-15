import { z } from "zod";
import { getCloudBaseManager, getEnvId } from '../cloudbase-manager.js';
import { ExtendedMcpServer } from '../server.js';

// 获取数据库实例ID (复用database.ts中的逻辑)
async function getDatabaseInstanceId(getManager: () => Promise<any>) {
  const cloudbase = await getManager();
  const { EnvInfo } = await cloudbase.env.getEnvInfo();
  if (!EnvInfo?.Databases?.[0]?.InstanceId) {
    throw new Error("无法获取数据库实例ID");
  }
  return EnvInfo.Databases[0].InstanceId;
}

// 定义权限级别枚举
const PermissionLevels = z.enum(['none', 'read', 'write', 'admin'], {
  description: "权限级别：none=无权限，read=只读，write=读写，admin=管理员权限"
});

// 定义服务类型枚举
const ServiceTypes = z.enum(['database', 'functions', 'storage'], {
  description: "服务类型：database=数据库，functions=云函数，storage=云存储"
});

// 数据库规则定义
const DatabaseRuleSchema = z.object({
  collectionName: z.string().describe("集合名称"),
  permission: PermissionLevels.describe("简易权限级别")
});

// 云函数规则定义  
const FunctionRuleSchema = z.object({
  functionName: z.string().describe("云函数名称"),
  permission: PermissionLevels.describe("简易权限级别")
});

// 云存储规则定义
const StorageRuleSchema = z.object({
  bucket: z.string().optional().describe("存储桶名称（可选）"),
  path: z.string().optional().describe("存储路径（可选）"),
  permission: PermissionLevels.describe("简易权限级别")
});

export function registerSecurityTools(server: ExtendedMcpServer) {
  // 获取 cloudBaseOptions，如果没有则为 undefined
  const cloudBaseOptions = server.cloudBaseOptions;

  // 创建闭包函数来获取 CloudBase Manager
  const getManager = () => getCloudBaseManager({ cloudBaseOptions });

  // 读取安全规则工具
  server.registerTool?.(
    "readSecurityRules",
    {
      title: "读取安全规则",
      description: "读取云开发服务的安全规则配置，包括数据库简易权限、云函数权限和云存储权限。支持查询特定资源或全部资源的权限配置。",
      inputSchema: {
        serviceType: ServiceTypes.describe("要查询的服务类型"),
        resourceName: z.string().optional().describe("资源名称（可选）：数据库为集合名称，云函数为函数名称，云存储为存储桶或路径")
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        category: "security"
      }
    },
    async ({ serviceType, resourceName }: { serviceType: 'database' | 'functions' | 'storage'; resourceName?: string }) => {
      try {
        const cloudbase = await getManager();
        let result;

        switch (serviceType) {
          case 'database':
            const instanceId = await getDatabaseInstanceId(getManager);
            
            const params: any = {
              Tag: instanceId
            };
            
            // 如果指定了资源名称（集合名），则查询特定集合的权限
            if (resourceName) {
              params.CollectionName = resourceName;
            }
            
            result = await cloudbase.commonService('flexdb').call({
              Action: 'GetDatabaseSimplePermission',
              Param: params
            });
            
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  success: true,
                  serviceType: 'database',
                  resourceName: resourceName || 'all',
                  requestId: result.RequestId,
                  rules: result.Rules || [],
                  defaultPermission: result.DefaultPermission,
                  message: resourceName 
                    ? `获取数据库集合 ${resourceName} 的权限配置成功` 
                    : "获取数据库权限配置成功"
                }, null, 2)
              }]
            };

          case 'functions':
            // 云函数权限查询 (待CloudBase支持时实现)
            result = await cloudbase.commonService('scf').call({
              Action: 'GetFunctionPermission',
              Param: {
                FunctionName: resourceName || '*'
              }
            });
            
            return {
              content: [{
                type: "text", 
                text: JSON.stringify({
                  success: true,
                  serviceType: 'functions',
                  resourceName: resourceName || 'all',
                  requestId: result.RequestId,
                  rules: result.Rules || [],
                  message: "获取云函数权限配置成功"
                }, null, 2)
              }]
            };

          case 'storage':
            // 云存储权限查询 (待CloudBase支持时实现)
            result = await cloudbase.commonService('cos').call({
              Action: 'GetStoragePermission',
              Param: {
                Bucket: resourceName
              }
            });
            
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  success: true,
                  serviceType: 'storage',
                  resourceName: resourceName || 'all',
                  requestId: result.RequestId,
                  rules: result.Rules || [],
                  message: "获取云存储权限配置成功"
                }, null, 2)
              }]
            };

          default:
            throw new Error(`不支持的服务类型: ${serviceType}`);
        }
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              serviceType,
              resourceName,
              error: error.message,
              message: "读取安全规则失败"
            }, null, 2)
          }]
        };
      }
    }
  );

  // 写入安全规则工具
  server.registerTool?.(
    "writeSecurityRules",
    {
      title: "写入安全规则",
      description: "设置云开发服务的安全规则配置，包括数据库简易权限、云函数权限和云存储权限。支持批量设置多个资源的权限。AI可以通过此工具轻松管理各种服务的权限配置。",
      inputSchema: {
        serviceType: ServiceTypes.describe("要设置的服务类型"),
        rules: z.array(z.union([
          DatabaseRuleSchema,
          FunctionRuleSchema, 
          StorageRuleSchema
        ])).describe("权限规则列表，根据serviceType选择对应的规则格式")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
        category: "security"
      }
    },
    async ({ serviceType, rules }: { 
      serviceType: 'database' | 'functions' | 'storage'; 
      rules: Array<{
        collectionName?: string;
        functionName?: string;
        bucket?: string;
        path?: string;
        permission: 'none' | 'read' | 'write' | 'admin';
      }>
    }) => {
      try {
        const cloudbase = await getManager();
        const results = [];

        switch (serviceType) {
          case 'database':
            const instanceId = await getDatabaseInstanceId(getManager);
            
            // 批量设置数据库集合权限
            for (const rule of rules) {
              if (!rule.collectionName) {
                throw new Error("数据库规则必须指定 collectionName");
              }
              
              const result = await cloudbase.commonService('flexdb').call({
                Action: 'SetDatabaseSimplePermission',
                Param: {
                  Tag: instanceId,
                  CollectionName: rule.collectionName,
                  Permission: rule.permission
                }
              });
              
              results.push({
                collectionName: rule.collectionName,
                permission: rule.permission,
                requestId: result.RequestId,
                success: true
              });
            }
            
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  success: true,
                  serviceType: 'database',
                  results,
                  message: `成功设置 ${results.length} 个数据库集合的权限配置`
                }, null, 2)
              }]
            };

          case 'functions':
            // 云函数权限设置 (待CloudBase支持时实现)
            for (const rule of rules) {
              if (!rule.functionName) {
                throw new Error("云函数规则必须指定 functionName");
              }
              
              const result = await cloudbase.commonService('scf').call({
                Action: 'SetFunctionPermission',
                Param: {
                  FunctionName: rule.functionName,
                  Permission: rule.permission
                }
              });
              
              results.push({
                functionName: rule.functionName,
                permission: rule.permission,
                requestId: result.RequestId,
                success: true
              });
            }
            
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  success: true,
                  serviceType: 'functions',
                  results,
                  message: `成功设置 ${results.length} 个云函数的权限配置`
                }, null, 2)
              }]
            };

          case 'storage':
            // 云存储权限设置 (待CloudBase支持时实现)
            for (const rule of rules) {
              const result = await cloudbase.commonService('cos').call({
                Action: 'SetStoragePermission',
                Param: {
                  Bucket: rule.bucket,
                  Path: rule.path,
                  Permission: rule.permission
                }
              });
              
              results.push({
                bucket: rule.bucket,
                path: rule.path,
                permission: rule.permission,
                requestId: result.RequestId,
                success: true
              });
            }
            
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  success: true,
                  serviceType: 'storage',
                  results,
                  message: `成功设置 ${results.length} 个云存储的权限配置`
                }, null, 2)
              }]
            };

          default:
            throw new Error(`不支持的服务类型: ${serviceType}`);
        }
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              serviceType,
              error: error.message,
              message: "写入安全规则失败"
            }, null, 2)
          }]
        };
      }
    }
  );
}