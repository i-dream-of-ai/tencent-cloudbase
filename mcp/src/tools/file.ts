import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";
import { getCloudBaseManager } from '../cloudbase-manager.js'

// 常量定义
const MAX_FILE_SIZE = 100 * 1024; // 100KB in bytes

// 生成随机文件名
function generateRandomFileName(extension = '') {
  const randomBytes = crypto.randomBytes(16);
  const fileName = randomBytes.toString('hex');
  return `${fileName}${extension}`;
}

// 获取安全的临时文件路径
function getSafeTempFilePath(fileName: string) {
  return path.join(os.tmpdir(), fileName);
}

// 检查 base64 字符串大小
function checkBase64Size(base64String: string): boolean {
  // 计算 base64 解码后的实际大小
  // base64 字符串长度 * 0.75 约等于实际二进制数据大小
  const actualSize = Math.ceil(base64String.length * 0.75);
  return actualSize <= MAX_FILE_SIZE;
}

// 检查文件路径是否在临时目录中
function isInTempDir(filePath: string): boolean {
  const normalizedPath = path.normalize(filePath);
  const normalizedTempDir = path.normalize(os.tmpdir());
  return normalizedPath.startsWith(normalizedTempDir);
}

export function registerFileTools(server: McpServer) {
  // 统一的临时文件管理工具
  server.tool(
    "manageTempFile",
    "统一的临时文件管理工具，支持创建、读取临时文件操作",
    {
      action: z.enum(["create", "read"]).describe("操作类型: create=创建文件, read=读取文件"),
      // create操作参数
      content: z.string().optional().describe("文件内容，可以是普通文本或 base64 编码的二进制内容（create操作必需）"),
      isBase64: z.boolean().optional().describe("是否为 base64 编码的内容（create操作使用）"),
      extension: z.string().optional().describe("文件扩展名，例如 .txt, .png 等（create操作使用）"),
      // read操作参数
      filePath: z.string().optional().describe("要读取的文件路径（read操作必需）"),
      asBase64: z.boolean().optional().describe("是否以 base64 格式返回内容（read操作使用）")
    },
    async ({ action, content, isBase64 = false, extension = '', filePath, asBase64 = false }) => {
      try {
        switch (action) {
          case "create":
            if (!content) {
              throw new Error("创建文件需要提供content参数");
            }

            // 如果是 base64 内容，先检查大小
            if (isBase64) {
              if (!checkBase64Size(content)) {
                return {
                  content: [
                    {
                      type: "text",
                      text: JSON.stringify({
                        success: false,
                        error: "文件大小超过限制",
                        message: `文件大小超过 ${MAX_FILE_SIZE / 1024}KB 限制`
                      }, null, 2)
                    }
                  ]
                };
              }
            }

            const fileName = generateRandomFileName(extension);
            const createdFilePath = getSafeTempFilePath(fileName);

            if (isBase64) {
              // 解码 base64 并写入二进制文件
              const buffer = Buffer.from(content, 'base64');
              await fs.writeFile(createdFilePath, buffer);
            } else {
              // 写入文本文件
              await fs.writeFile(createdFilePath, content, 'utf-8');
            }

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    success: true,
                    filePath: createdFilePath,
                    message: "文件创建成功",
                    fileSize: isBase64 ? Math.ceil(content.length * 0.75) : Buffer.from(content).length
                  }, null, 2)
                }
              ]
            };

          case "read":
            if (!filePath) {
              throw new Error("读取文件需要提供filePath参数");
            }

            // 安全检查：确保文件路径在临时目录中
            if (!isInTempDir(filePath)) {
              return {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify({
                      success: false,
                      error: "安全限制",
                      message: "只能读取临时目录中的文件"
                    }, null, 2)
                  }
                ]
              };
            }

            // 检查文件是否存在
            try {
              await fs.access(filePath);
            } catch {
              return {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify({
                      success: false,
                      error: "文件不存在",
                      message: "指定的文件不存在"
                    }, null, 2)
                  }
                ]
              };
            }

            // 检查文件大小
            const stats = await fs.stat(filePath);
            if (stats.size > MAX_FILE_SIZE) {
              return {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify({
                      success: false,
                      error: "文件大小超过限制",
                      message: `文件大小 ${stats.size} 字节超过 ${MAX_FILE_SIZE} 字节限制`
                    }, null, 2)
                  }
                ]
              };
            }

            // 读取文件
            const buffer = await fs.readFile(filePath);

            let fileContent: string;
            if (asBase64) {
              fileContent = buffer.toString('base64');
            } else {
              fileContent = buffer.toString('utf-8');
            }

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    success: true,
                    content: fileContent,
                    fileSize: buffer.length,
                    encoding: asBase64 ? 'base64' : 'utf-8',
                    message: "文件读取成功"
                  }, null, 2)
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
                message: `临时文件${action}操作失败`
              }, null, 2)
            }
          ]
        };
      }
    }
  );
}