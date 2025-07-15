import { z } from "zod";
import { getCloudBaseManager } from '../cloudbase-manager.js'
import { ExtendedMcpServer } from '../server.js';

/**
 * 安全规则类型枚举
 */
const SecurityRuleServiceType = z.enum(['database', 'functions', 'storage']).describe("服务类型：database=数据库，functions=云函数，storage=云存储");

/**
 * 数据库集合安全规则类型
 */
const DatabaseRuleType = z.object({
  collectionName: z.string().describe("数据库集合名称"),
  read: z.string().optional().describe("读取权限规则"),
  write: z.string().optional().describe("写入权限规则")
});

/**
 * 云函数安全规则类型
 */
const FunctionRuleType = z.object({
  functionName: z.string().describe("云函数名称"),
  invoke: z.string().optional().describe("调用权限规则")
});

/**
 * 云存储安全规则类型
 */
const StorageRuleType = z.object({
  path: z.string().describe("文件路径规则（支持通配符，如：/images/*）"),
  read: z.string().optional().describe("读取权限规则"),
  write: z.string().optional().describe("写入权限规则")
});

export function registerSecurityTools(server: ExtendedMcpServer) {
  // 获取 cloudBaseOptions，如果没有则为 undefined
  const cloudBaseOptions = server.cloudBaseOptions;

  // 创建闭包函数来获取 CloudBase Manager
  const getManager = () => getCloudBaseManager({ cloudBaseOptions });

  // readSecurityRules - 读取安全规则
  server.registerTool?.(
    "readSecurityRules",
    {
      title: "读取安全规则",
      description: "读取云开发服务的安全规则配置，支持数据库、云函数、云存储的安全规则查询",
      inputSchema: {
        serviceType: SecurityRuleServiceType,
        resourceName: z.string().optional().describe("资源名称（数据库集合名/函数名/存储路径，不指定则返回所有）")
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        category: "security"
      }
    },
    async ({ serviceType, resourceName }: { serviceType: "database" | "functions" | "storage"; resourceName?: string }) => {
      try {
        const cloudbase = await getManager();
        let result: any;

        switch (serviceType) {
          case "database":
            // 读取数据库安全规则
            if (resourceName) {
              // 获取指定集合的安全规则
              result = await cloudbase.commonService('tcb').call({
                Action: 'DescribeSecurityRules',
                Param: {
                  ResourceType: 'database',
                  ResourceName: resourceName
                }
              });
            } else {
              // 获取所有数据库集合的安全规则
              result = await cloudbase.commonService('tcb').call({
                Action: 'DescribeSecurityRules',
                Param: {
                  ResourceType: 'database'
                }
              });
            }
            break;

          case "functions":
            // 读取云函数安全规则
            if (resourceName) {
              // 获取指定函数的安全规则
              result = await cloudbase.commonService('tcb').call({
                Action: 'DescribeSecurityRules',
                Param: {
                  ResourceType: 'function',
                  ResourceName: resourceName
                }
              });
            } else {
              // 获取所有云函数的安全规则
              result = await cloudbase.commonService('tcb').call({
                Action: 'DescribeSecurityRules',
                Param: {
                  ResourceType: 'function'
                }
              });
            }
            break;

          case "storage":
            // 读取云存储安全规则
            result = await cloudbase.commonService('tcb').call({
              Action: 'DescribeSecurityRules',
              Param: {
                ResourceType: 'storage',
                ...(resourceName && { ResourceName: resourceName })
              }
            });
            break;

          default:
            throw new Error(`不支持的服务类型: ${serviceType}`);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                serviceType,
                resourceName,
                rules: result.Rules || result.Data || result,
                requestId: result.RequestId,
                message: `${serviceType}安全规则读取成功`
              }, null, 2)
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                serviceType,
                resourceName,
                error: error.message,
                message: `${serviceType}安全规则读取失败`
              }, null, 2)
            }
          ]
        };
      }
    }
  );

  // writeSecurityRules - 写入安全规则
  server.registerTool?.(
    "writeSecurityRules",
    {
      title: "写入安全规则",
      description: "设置云开发服务的安全规则配置，支持数据库、云函数、云存储的安全规则管理。规则语法基于CloudBase安全规则DSL，支持条件表达式如auth.uid、resource.data等",
      inputSchema: {
        serviceType: SecurityRuleServiceType,
        rules: z.union([
          z.array(DatabaseRuleType).describe("数据库安全规则数组"),
          z.array(FunctionRuleType).describe("云函数安全规则数组"),
          z.array(StorageRuleType).describe("云存储安全规则数组")
        ]).describe("安全规则配置")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        category: "security"
      }
    },
    async ({ serviceType, rules }: { 
      serviceType: "database" | "functions" | "storage"; 
      rules: any[] 
    }) => {
      try {
        const cloudbase = await getManager();
        let result: any;

        // 格式化规则数据
        const formattedRules = rules.map(rule => {
          switch (serviceType) {
            case "database":
              return {
                ResourceType: 'database',
                ResourceName: rule.collectionName,
                Rules: {
                  read: rule.read || "auth != null", // 默认需要登录
                  write: rule.write || "auth != null" // 默认需要登录
                }
              };

            case "functions":
              return {
                ResourceType: 'function',
                ResourceName: rule.functionName,
                Rules: {
                  invoke: rule.invoke || "auth != null" // 默认需要登录
                }
              };

            case "storage":
              return {
                ResourceType: 'storage',
                ResourceName: rule.path,
                Rules: {
                  read: rule.read || "auth != null", // 默认需要登录
                  write: rule.write || "auth != null" // 默认需要登录
                }
              };

            default:
              throw new Error(`不支持的服务类型: ${serviceType}`);
          }
        });

        // 批量设置安全规则
        result = await cloudbase.commonService('tcb').call({
          Action: 'ModifySecurityRules',
          Param: {
            Rules: formattedRules
          }
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                serviceType,
                rulesCount: formattedRules.length,
                requestId: result.RequestId,
                message: `${serviceType}安全规则设置成功，共更新${formattedRules.length}条规则`
              }, null, 2)
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                serviceType,
                error: error.message,
                message: `${serviceType}安全规则设置失败`
              }, null, 2)
            }
          ]
        };
      }
    }
  );
}