import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getCloudBaseManager } from '../cloudbase-manager.js'

// 定义扩展的EnvInfo接口，包含StaticStorages属性
interface ExtendedEnvInfo {
  EnvInfo: {
    StaticStorages?: Array<{
      StaticDomain: string;
      [key: string]: any;
    }>;
    [key: string]: any;
  };
  [key: string]: any;
}

export function registerHostingTools(server: McpServer) {
  // 统一的文件管理工具
  server.tool(
    "manageHostingFiles",
    "统一的静态网站托管文件管理工具，支持上传、列表、删除、搜索文件操作",
    {
      action: z.enum(["upload", "list", "delete", "find"]).describe("操作类型: upload=上传文件, list=获取文件列表, delete=删除文件, find=搜索文件"),
      // upload操作参数
      localPath: z.string().optional().describe("本地文件或文件夹路径，需要是绝对路径（upload操作使用）"),
      cloudPath: z.string().optional().describe("云端文件或文件夹路径（upload、delete操作使用）"),
      files: z.array(z.object({
        localPath: z.string(),
        cloudPath: z.string()
      })).optional().describe("多文件上传配置（upload操作使用）"),
      ignore: z.union([z.string(), z.array(z.string())]).optional().describe("忽略文件模式（upload操作使用）"),
      // delete操作参数
      isDir: z.boolean().optional().describe("是否为文件夹（delete操作使用）"),
      // find操作参数
      prefix: z.string().optional().describe("匹配前缀（find操作必需）"),
      marker: z.string().optional().describe("起始对象键标记（find操作使用）"),
      maxKeys: z.number().optional().describe("单次返回最大条目数（find操作使用）"),
      // list操作参数
      confirm: z.literal("yes").optional().describe("确认操作（list操作使用）")
    },
    async ({ action, localPath, cloudPath, files, ignore, isDir, prefix, marker, maxKeys, confirm }) => {
      try {
        const cloudbase = await getCloudBaseManager()
        let result;

        switch (action) {
          case "upload":
            result = await cloudbase.hosting.uploadFiles({
              localPath,
              cloudPath,
              files: files || [],
              ignore
            });

            // 获取环境信息
            const envInfo = await cloudbase.env.getEnvInfo() as ExtendedEnvInfo;

            // 获取静态网站地址
            let staticDomain = "";
            if (envInfo?.EnvInfo?.StaticStorages && envInfo.EnvInfo.StaticStorages.length > 0) {
              staticDomain = envInfo.EnvInfo.StaticStorages[0].StaticDomain;
            }

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    uploadResult: result?.files.map((item: { Key: any; }) => {
                      return item.Key
                    }),
                    staticWebsiteUrl: staticDomain ? `https://${staticDomain}` : "",
                    fileUrl: staticDomain && cloudPath ? `https://${staticDomain}/${cloudPath}` : ""
                  }, null, 2)
                }
              ]
            };

          case "list":
            result = await cloudbase.hosting.listFiles();
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2)
                }
              ]
            };

          case "delete":
            if (!cloudPath) {
              throw new Error("删除文件需要提供cloudPath参数");
            }
            result = await cloudbase.hosting.deleteFiles({
              cloudPath,
              isDir: isDir || false
            });
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2)
                }
              ]
            };

          case "find":
            if (!prefix) {
              throw new Error("搜索文件需要提供prefix参数");
            }
            result = await cloudbase.hosting.findFiles({
              prefix,
              marker,
              maxKeys
            });
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2)
                }
              ]
            };

          default:
            throw new Error(`不支持的操作类型: ${action}`);
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: error.message,
                message: `静态网站托管文件${action}操作失败`
              }, null, 2)
            }
          ]
        };
      }
    }
  );

  // domainManagement - 统一的域名管理工具
  server.tool(
    "domainManagement",
    "统一的域名管理工具，支持绑定、解绑、查询和修改域名配置",
    {
      action: z.enum(["create", "delete", "check", "modify"]).describe("操作类型: create=绑定域名, delete=解绑域名, check=查询域名配置, modify=修改域名配置"),
      // 绑定域名参数
      domain: z.string().optional().describe("域名"),
      certId: z.string().optional().describe("证书ID（绑定域名时必需）"),
      // 查询域名参数
      domains: z.array(z.string()).optional().describe("域名列表（查询配置时使用）"),
      // 修改域名参数
      domainId: z.number().optional().describe("域名ID（修改配置时必需）"),
      domainConfig: z.object({
        Refer: z.object({
          Switch: z.string(),
          RefererRules: z.array(z.object({
            RefererType: z.string(),
            Referers: z.array(z.string()),
            AllowEmpty: z.boolean()
          })).optional()
        }).optional(),
        Cache: z.array(z.object({
          RuleType: z.string(),
          RuleValue: z.string(),
          CacheTtl: z.number()
        })).optional(),
        IpFilter: z.object({
          Switch: z.string(),
          FilterType: z.string().optional(),
          Filters: z.array(z.string()).optional()
        }).optional(),
        IpFreqLimit: z.object({
          Switch: z.string(),
          Qps: z.number().optional()
        }).optional()
      }).optional().describe("域名配置（修改配置时使用）")
    },
    async ({ action, domain, certId, domains, domainId, domainConfig }) => {
      const cloudbase = await getCloudBaseManager()
      let result;

      switch (action) {
        case "create":
          if (!domain || !certId) {
            throw new Error("绑定域名需要提供域名和证书ID");
          }
          result = await cloudbase.hosting.CreateHostingDomain({
            domain,
            certId
          });
          break;

        case "delete":
          if (!domain) {
            throw new Error("解绑域名需要提供域名");
          }
          result = await cloudbase.hosting.deleteHostingDomain({
            domain
          });
          break;

        case "check":
          if (!domains || domains.length === 0) {
            throw new Error("查询域名配置需要提供域名列表");
          }
          result = await cloudbase.hosting.tcbCheckResource({
            domains
          });
          break;

        case "modify":
          if (!domain || domainId === undefined || !domainConfig) {
            throw new Error("修改域名配置需要提供域名、域名ID和配置信息");
          }
          result = await cloudbase.hosting.tcbModifyAttribute({
            domain,
            domainId,
            domainConfig
          });
          break;

        default:
          throw new Error(`不支持的操作类型: ${action}`);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              action,
              result
            }, null, 2)
          }
        ]
      };
    }
  );

  // getWebsiteConfig - 获取静态网站配置
  server.tool(
    "getWebsiteConfig",
    "获取静态网站配置",
    {
      confirm: z.literal("yes").describe("确认操作，默认传 yes")
    },
    async () => {
      const cloudbase = await getCloudBaseManager()
      const result = await cloudbase.hosting.getWebsiteConfig();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );
}
