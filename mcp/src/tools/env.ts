import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import CloudBase from "@cloudbase/manager-node";

// 初始化CloudBase
const cloudbase = new CloudBase({
  secretId: process.env.TENCENTCLOUD_SECRETID,
  secretKey: process.env.TENCENTCLOUD_SECRETKEY,
  envId: process.env.CLOUDBASE_ENV_ID,
  token: process.env.TENCENTCLOUD_SESSIONTOKEN
});

export function registerEnvTools(server: McpServer) {
  // listEnvs
  server.tool(
    "listEnvs",
    "获取所有云开发环境信息",
    {},
    async () => {
      const result = await cloudbase.env.listEnvs();
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

  // getEnvAuthDomains
  server.tool(
    "getEnvAuthDomains",
    "获取云开发环境的合法域名列表",
    {},
    async () => {
      const result = await cloudbase.env.getEnvAuthDomains();
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

  // createEnvDomain
  server.tool(
    "createEnvDomain",
    "为云开发环境添加安全域名",
    {
      domains: z.array(z.string()).describe("安全域名数组")
    },
    async ({ domains }) => {
      const result = await cloudbase.env.createEnvDomain(domains);
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

  // deleteEnvDomain
  server.tool(
    "deleteEnvDomain",
    "删除云开发环境的指定安全域名",
    {
      domains: z.array(z.string()).describe("安全域名数组")
    },
    async ({ domains }) => {
      const result = await cloudbase.env.deleteEnvDomain(domains);
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

  // getEnvInfo
  server.tool(
    "getEnvInfo",
    "获取当前云开发环境信息",
    {},
    async () => {
      const result = await cloudbase.env.getEnvInfo();
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

  // updateEnvInfo
  server.tool(
    "updateEnvInfo",
    "修改云开发环境别名",
    {
      alias: z.string().describe("环境别名")
    },
    async ({ alias }) => {
      const result = await cloudbase.env.updateEnvInfo(alias);
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

  // // getLoginConfigList
  // server.tool(
  //   "getLoginConfigList",
  //   "拉取登录配置列表",
  //   {},
  //   async () => {
  //     const result = await cloudbase.env.getLoginConfigList();
  //     return {
  //       content: [
  //         {
  //           type: "text",
  //           text: JSON.stringify(result, null, 2)
  //         }
  //       ]
  //     };
  //   }
  // );

  // // createLoginConfig
  // server.tool(
  //   "createLoginConfig",
  //   "创建登录方式",
  //   {
  //     platform: z.enum(["WECHAT-OPEN", "WECHAT-PUBLIC", "QQ", "ANONYMOUS"]).describe("平台类型"),
  //     appId: z.string().describe("第三方平台的AppID"),
  //     appSecret: z.string().optional().describe("第三方平台的AppSecret")
  //   },
  //   async ({ platform, appId, appSecret }) => {
  //     const result = await cloudbase.env.createLoginConfig(platform, appId, appSecret);
  //     return {
  //       content: [
  //         {
  //           type: "text",
  //           text: JSON.stringify(result, null, 2)
  //         }
  //       ]
  //     };
  //   }
  // );

  // // updateLoginConfig
  // server.tool(
  //   "updateLoginConfig",
  //   "更新登录方式配置",
  //   {
  //     configId: z.string().describe("配置的记录ID"),
  //     status: z.enum(["ENABLE", "DISABLE"]).describe("配置状态"),
  //     appId: z.string().describe("第三方平台的AppId"),
  //     appSecret: z.string().optional().describe("第三方平台的AppSecret")
  //   },
  //   async ({ configId, status, appId, appSecret }) => {
  //     const result = await cloudbase.env.updateLoginConfig(configId, status, appId, appSecret);
  //     return {
  //       content: [
  //         {
  //           type: "text",
  //           text: JSON.stringify(result, null, 2)
  //         }
  //       ]
  //     };
  //   }
  // );

  // // createCustomLoginKeys
  // server.tool(
  //   "createCustomLoginKeys",
  //   "创建自定义登录密钥",
  //   {},
  //   async () => {
  //     const result = await cloudbase.env.createCustomLoginKeys();
  //     return {
  //       content: [
  //         {
  //           type: "text",
  //           text: JSON.stringify(result, null, 2)
  //         }
  //       ]
  //     };
  //   }
  // );
} 