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

export function registerStorageTools(server: McpServer) {
  // uploadFile - 上传文件到云存储
  server.tool(
    "uploadFile",
    "上传文件到云存储（区别于静态网站托管，云存储更适合存储业务数据文件）",
    {
      localPath: z.string().describe("本地文件路径，建议传入绝对路径，例如 /tmp/files/data.txt"),
      cloudPath: z.string().describe("云端文件路径，例如 files/data.txt"),
    },
    async ({ localPath, cloudPath }) => {
      // 上传文件
      await cloudbase.storage.uploadFile({
        localPath,
        cloudPath,
        onProgress: (progressData) => {
          console.log("Upload progress:", progressData);
        }
      });

      // 获取文件临时下载地址
      const fileUrls = await cloudbase.storage.getTemporaryUrl([{
        cloudPath: cloudPath,
        maxAge: 3600 // 临时链接有效期1小时
      }]);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              message: "文件上传成功",
              cloudPath: cloudPath,
              temporaryUrl: fileUrls[0]?.url || "",
              expireTime: "1小时"
            }, null, 2)
          }
        ]
      };
    }
  );
} 