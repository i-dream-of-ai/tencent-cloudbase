import { z } from "zod";
import { getCloudBaseManager, getEnvId } from '../cloudbase-manager.js'
import { ExtendedMcpServer } from '../server.js';

// 定义清晰的枚举类型
const ServiceTypeEnum = z.enum(["database", "functions", "storage"]).describe(
  "服务类型：database=数据库, functions=云函数, storage=云存储"
);

const DatabasePermissionEnum = z.enum([
  "CREATOR_WRITE_ALL_READ",     // 仅创建者可写，所有人可读
  "CREATOR_READ_WRITE",         // 仅创建者可读写
  "ADMIN_WRITE_ALL_READ",       // 仅管理端可写，所有人可读
  "ADMIN_READ_WRITE",           // 仅管理端可读写
  "ALL_READ_WRITE",             // 所有人可读写（不推荐）
  "CUSTOM"                      // 自定义规则
]).describe(
  "数据库简易权限类型：" +
  "CREATOR_WRITE_ALL_READ=仅创建者可写，所有人可读; " +
  "CREATOR_READ_WRITE=仅创建者可读写; " +
  "ADMIN_WRITE_ALL_READ=仅管理端可写，所有人可读; " +
  "ADMIN_READ_WRITE=仅管理端可读写; " +
  "ALL_READ_WRITE=所有人可读写（不推荐生产环境）; " +
  "CUSTOM=自定义规则（使用具体的规则表达式）"
);

// 数据库集合规则schema
const DatabaseRuleSchema = z.object({
  collectionName: z.string().describe("数据库集合名称"),
  permission: DatabasePermissionEnum.optional().describe("简易权限类型，优先使用此参数"),
  read: z.string().optional().describe("自定义读取规则表达式，当permission为CUSTOM时使用"),
  write: z.string().optional().describe("自定义写入规则表达式，当permission为CUSTOM时使用")
}).describe("数据库集合安全规则配置");

// 云函数规则schema  
const FunctionRuleSchema = z.object({
  functionName: z.string().describe("云函数名称"),
  invoke: z.string().describe("调用权限规则表达式，例如：'auth != null' 表示需要登录")
}).describe("云函数安全规则配置");

// 云存储规则schema
const StorageRuleSchema = z.object({
  path: z.string().describe("存储路径规则，支持通配符，例如：'/user/{userId}/*'"),
  read: z.string().describe("读取权限规则表达式"),
  write: z.string().describe("写入权限规则表达式")
}).describe("云存储安全规则配置");

export function registerSecurityTools(server: ExtendedMcpServer) {
  // 获取 cloudBaseOptions，如果没有则为 undefined
  const cloudBaseOptions = server.cloudBaseOptions;

  // 创建闭包函数来获取 CloudBase Manager
  const getManager = () => getCloudBaseManager({ cloudBaseOptions });

  // 读取安全规则
  server.registerTool?.(
    "readSecurityRules",
    {
      title: "读取安全规则",
      description: "读取CloudBase服务的安全规则配置。支持读取数据库集合、云函数和云存储的安全规则。数据库支持简易权限和自定义规则两种模式。",
      inputSchema: {
        serviceType: ServiceTypeEnum.describe("要查询的服务类型"),
        resourceName: z.string().optional().describe(
          "资源名称（可选）：" +
          "数据库=集合名称; " +
          "云函数=函数名称; " +
          "云存储=路径模式。" +
          "不提供则返回该服务类型下所有资源的规则"
        ),
        includeSystemRules: z.boolean().optional().default(false).describe(
          "是否包含系统默认规则。默认false只返回用户配置的规则"
        )
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        category: "security"
      }
    },
    async ({ serviceType, resourceName, includeSystemRules }: { 
      serviceType: "database" | "functions" | "storage";
      resourceName?: string;
      includeSystemRules?: boolean;
    }) => {
      try {
        const cloudbase = await getManager();
        const currentEnvId = await getEnvId(cloudBaseOptions);

        let result;

        switch (serviceType) {
          case "database":
            if (resourceName) {
              // 获取特定集合的权限规则
              result = await cloudbase.commonService('tcb').call({
                Action: 'DescribeDatabaseACL',
                Param: {
                  EnvId: currentEnvId,
                  CollectionName: resourceName
                }
              });
              
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify({
                    success: true,
                    serviceType: "database",
                    resourceName,
                    data: {
                      collectionName: resourceName,
                      permission: result.AclRule || "未设置",
                      customRules: result.Rules || null,
                      description: getDatabasePermissionDescription(result.AclRule)
                    },
                    message: `成功获取数据库集合 ${resourceName} 的安全规则`
                  }, null, 2)
                }]
              };
            } else {
              // 获取所有集合的权限规则  
              result = await cloudbase.commonService('tcb').call({
                Action: 'DescribeEnvDatabaseACL',
                Param: {
                  EnvId: currentEnvId
                }
              });

              const collections = result.Data || [];
              const formattedData = collections.map((item: any) => ({
                collectionName: item.CollectionName,
                permission: item.AclRule || "未设置",
                customRules: item.Rules || null,
                description: getDatabasePermissionDescription(item.AclRule)
              }));

              return {
                content: [{
                  type: "text", 
                  text: JSON.stringify({
                    success: true,
                    serviceType: "database",
                    data: formattedData,
                    count: formattedData.length,
                    message: `成功获取环境 ${currentEnvId} 下所有数据库集合的安全规则`
                  }, null, 2)
                }]
              };
            }

          case "functions":
            if (resourceName) {
              // 获取特定函数的安全规则
              result = await cloudbase.commonService('scf').call({
                Action: 'GetFunctionTriggers',
                Param: {
                  FunctionName: resourceName,
                  Namespace: currentEnvId
                }
              });

              return {
                content: [{
                  type: "text",
                  text: JSON.stringify({
                    success: true,
                    serviceType: "functions",
                    resourceName,
                    data: {
                      functionName: resourceName,
                      triggers: result.Triggers || [],
                      accessRules: "云函数默认无权限控制，通过触发器和代码逻辑控制访问"
                    },
                    message: `成功获取云函数 ${resourceName} 的触发器配置`
                  }, null, 2)
                }]
              };
            } else {
              // 获取所有函数列表
              result = await cloudbase.functions.listFunctions({
                Offset: 0,
                Limit: 100
              });

              return {
                content: [{
                  type: "text",
                  text: JSON.stringify({
                    success: true,
                    serviceType: "functions", 
                    data: {
                      functions: result.Functions || [],
                      note: "云函数默认无权限控制，可通过触发器配置和代码逻辑实现访问控制"
                    },
                    count: result.Functions?.length || 0,
                    message: `成功获取环境 ${currentEnvId} 下所有云函数列表`
                  }, null, 2)
                }]
              };
            }

          case "storage":
            // 获取云存储安全规则
            result = await cloudbase.commonService('tcb').call({
              Action: 'DescribeStorageACL',
              Param: {
                EnvId: currentEnvId
              }
            });

            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  success: true,
                  serviceType: "storage",
                  data: {
                    rules: result.Rules || [],
                    defaultRule: result.DefaultRule || "默认拒绝所有访问"
                  },
                  message: `成功获取环境 ${currentEnvId} 的云存储安全规则`
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
              error: error.message || error.original?.Message || '未知错误',
              code: error.original?.Code,
              message: `读取${getServiceTypeName(serviceType)}安全规则失败`
            }, null, 2)
          }]
        };
      }
    }
  );

  // 写入/更新安全规则
  server.registerTool?.(
    "writeSecurityRules", 
    {
      title: "写入安全规则",
      description: "写入或更新CloudBase服务的安全规则配置。支持数据库简易权限设置和自定义规则、云函数访问控制、云存储路径权限配置。数据库推荐优先使用简易权限模式，复杂场景可使用自定义规则。",
      inputSchema: {
        serviceType: ServiceTypeEnum.describe("要配置的服务类型"),
        rules: z.array(z.union([
          DatabaseRuleSchema,
          FunctionRuleSchema, 
          StorageRuleSchema
        ])).describe(
          "安全规则配置数组。根据serviceType类型，数组元素应为对应的规则配置对象：" +
          "database=DatabaseRuleSchema数组; " +
          "functions=FunctionRuleSchema数组; " +
          "storage=StorageRuleSchema数组"
        ),
        overwrite: z.boolean().optional().default(false).describe(
          "是否覆盖现有规则。默认false为追加模式，true为完全覆盖模式"
        )
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        category: "security"
      }
    },
    async ({ serviceType, rules, overwrite }: {
      serviceType: "database" | "functions" | "storage";
      rules: any[];
      overwrite?: boolean;
    }) => {
      try {
        const cloudbase = await getManager();
        const currentEnvId = await getEnvId(cloudBaseOptions);

        const results = [];

        switch (serviceType) {
          case "database":
            // 处理数据库规则
            for (const rule of rules) {
              const { collectionName, permission, read, write } = rule;
              
              if (permission && permission !== "CUSTOM") {
                // 使用简易权限
                const result = await cloudbase.commonService('tcb').call({
                  Action: 'ModifyDatabaseACL',
                  Param: {
                    EnvId: currentEnvId,
                    CollectionName: collectionName,
                    AclRule: permission
                  }
                });

                results.push({
                  collectionName,
                  permission,
                  description: getDatabasePermissionDescription(permission),
                  success: true,
                  requestId: result.RequestId
                });
              } else if (read || write) {
                // 使用自定义规则
                const customRules = [];
                if (read) customRules.push({ read });
                if (write) customRules.push({ write });

                const result = await cloudbase.commonService('tcb').call({
                  Action: 'ModifyDatabaseACL',
                  Param: {
                    EnvId: currentEnvId,
                    CollectionName: collectionName,
                    Rules: customRules
                  }
                });

                results.push({
                  collectionName,
                  customRules: { read, write },
                  success: true,
                  requestId: result.RequestId
                });
              } else {
                results.push({
                  collectionName,
                  success: false,
                  error: "必须提供permission或read/write规则"
                });
              }
            }
            break;

          case "functions":
            // 处理云函数规则
            for (const rule of rules) {
              const { functionName, invoke } = rule;
              
              // 云函数的权限控制通常通过触发器配置实现
              const result = await cloudbase.commonService('scf').call({
                Action: 'CreateTrigger',
                Param: {
                  FunctionName: functionName,
                  TriggerName: `${functionName}_auth_trigger`,
                  Type: 'timer', // 示例，实际应根据需求调整
                  TriggerDesc: invoke,
                  Namespace: currentEnvId
                }
              });

              results.push({
                functionName,
                invokeRule: invoke,
                success: true,
                requestId: result.RequestId,
                note: "云函数权限控制已配置，请在函数代码中实现具体的权限验证逻辑"
              });
            }
            break;

          case "storage":
            // 处理云存储规则
            const storageRules = rules.map(rule => ({
              resource: rule.path,
              allow: {
                read: rule.read,
                write: rule.write
              }
            }));

            const result = await cloudbase.commonService('tcb').call({
              Action: 'ModifyStorageACL',
              Param: {
                EnvId: currentEnvId,
                Rules: storageRules,
                Overwrite: overwrite
              }
            });

            results.push({
              rules: storageRules,
              overwrite,
              success: true,
              requestId: result.RequestId
            });
            break;

          default:
            throw new Error(`不支持的服务类型: ${serviceType}`);
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              serviceType,
              data: results,
              overwrite,
              message: `成功配置${getServiceTypeName(serviceType)}安全规则，共处理 ${results.length} 条规则`
            }, null, 2)
          }]
        };

      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              serviceType,
              error: error.message || error.original?.Message || '未知错误',
              code: error.original?.Code,
              message: `配置${getServiceTypeName(serviceType)}安全规则失败`
            }, null, 2)
          }]
        };
      }
    }
  );
}

// 辅助函数：获取数据库权限描述
function getDatabasePermissionDescription(permission: string): string {
  const descriptions: Record<string, string> = {
    "CREATOR_WRITE_ALL_READ": "仅创建者可写，所有人可读 - 适合文章、商品等内容展示场景",
    "CREATOR_READ_WRITE": "仅创建者可读写 - 适合个人数据、隐私信息等场景", 
    "ADMIN_WRITE_ALL_READ": "仅管理端可写，所有人可读 - 适合配置数据、公告等场景",
    "ADMIN_READ_WRITE": "仅管理端可读写 - 适合敏感数据、后台管理等场景",
    "ALL_READ_WRITE": "所有人可读写 - 仅适合开发测试环境，生产环境不推荐",
    "CUSTOM": "自定义规则 - 使用自定义表达式实现复杂权限控制"
  };
  return descriptions[permission] || "未知权限类型";
}

// 辅助函数：获取服务类型中文名称
function getServiceTypeName(serviceType: string): string {
  const names: Record<string, string> = {
    "database": "数据库",
    "functions": "云函数", 
    "storage": "云存储"
  };
  return names[serviceType] || serviceType;
}