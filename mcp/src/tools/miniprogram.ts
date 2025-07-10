import { z } from "zod";
import { ExtendedMcpServer } from '../server.js';
import { resolve } from 'path';
import { existsSync } from 'fs';

/**
 * 小程序 MCP 插件
 * 提供小程序开发和发布的相关工具
 */

export function registerMiniprogramTools(server: ExtendedMcpServer) {
  // 上传小程序代码
  server.registerTool?.(
    "uploadMiniprogramCode",
    {
      title: "上传小程序代码",
      description: "上传小程序代码到微信平台，类似于微信开发者工具的上传功能",
      inputSchema: {
        projectPath: z.string().describe("小程序项目路径"),
        version: z.string().describe("版本号"),
        desc: z.string().describe("版本描述"),
        appid: z.string().optional().describe("小程序 AppID，如果不提供将从 project.config.json 中读取"),
        privateKeyPath: z.string().optional().describe("代码上传密钥路径，如果不提供将从环境变量 MINIPROGRAM_PRIVATE_KEY_PATH 中读取"),
        privateKey: z.string().optional().describe("代码上传密钥内容，如果不提供将从环境变量 MINIPROGRAM_PRIVATE_KEY 中读取"),
        robot: z.number().optional().describe("机器人编号，可选值：1-30"),
        setting: z.object({
          es6: z.boolean().optional().describe("是否使用 ES6 转 ES5"),
          es7: z.boolean().optional().describe("是否使用 ES7 转 ES5"),
          minify: z.boolean().optional().describe("是否压缩代码"),
          codeProtect: z.boolean().optional().describe("是否代码保护"),
          autoPrefixWXSS: z.boolean().optional().describe("是否自动补全 WXSS")
        }).optional().describe("编译设置")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
        category: "miniprogram"
      }
    },
    async ({ projectPath, version, desc, appid, privateKeyPath, privateKey, robot = 1, setting = {} }) => {
      try {
        // 动态导入 miniprogram-ci
        const ci = await import('miniprogram-ci');
        
        // 验证项目路径
        if (!existsSync(projectPath)) {
          throw new Error(`项目路径不存在: ${projectPath}`);
        }
        
        // 获取私钥
        let key: string;
        if (privateKey) {
          key = privateKey;
        } else if (privateKeyPath) {
          const keyPath = resolve(privateKeyPath);
          if (!existsSync(keyPath)) {
            throw new Error(`私钥文件不存在: ${keyPath}`);
          }
          key = keyPath;
        } else {
          const envKeyPath = process.env.MINIPROGRAM_PRIVATE_KEY_PATH;
          const envKey = process.env.MINIPROGRAM_PRIVATE_KEY;
          if (envKey) {
            key = envKey;
          } else if (envKeyPath) {
            key = envKeyPath;
          } else {
            throw new Error("未提供私钥，请设置 privateKey、privateKeyPath 参数或环境变量 MINIPROGRAM_PRIVATE_KEY、MINIPROGRAM_PRIVATE_KEY_PATH");
          }
        }
        
        // 创建项目对象
        const project = new ci.Project({
          appid: appid || '', // 如果没有提供 appid，ci 会从 project.config.json 中读取
          type: 'miniProgram',
          projectPath: resolve(projectPath),
          privateKey: key,
          ignores: ['node_modules/**/*']
        });
        
        // 默认编译设置
        const uploadSetting = {
          es6: true,
          es7: true,
          minify: true,
          codeProtect: false,
          autoPrefixWXSS: true,
          ...setting
        };
        
        // 上传代码
        const uploadResult = await ci.upload({
          project,
          version,
          desc,
          robot,
          setting: uploadSetting
        });
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: "小程序代码上传成功",
                data: uploadResult
              }, null, 2)
            }
          ]
        };
        
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                message: "小程序代码上传失败",
                error: error instanceof Error ? error.message : String(error)
              }, null, 2)
            }
          ]
        };
      }
    }
  );

  // 预览小程序代码
  server.registerTool?.(
    "previewMiniprogramCode",
    {
      title: "预览小程序代码",
      description: "生成小程序预览二维码，类似于微信开发者工具的预览功能",
      inputSchema: {
        projectPath: z.string().describe("小程序项目路径"),
        desc: z.string().describe("预览描述"),
        appid: z.string().optional().describe("小程序 AppID，如果不提供将从 project.config.json 中读取"),
        privateKeyPath: z.string().optional().describe("代码上传密钥路径，如果不提供将从环境变量 MINIPROGRAM_PRIVATE_KEY_PATH 中读取"),
        privateKey: z.string().optional().describe("代码上传密钥内容，如果不提供将从环境变量 MINIPROGRAM_PRIVATE_KEY 中读取"),
        robot: z.number().optional().describe("机器人编号，可选值：1-30"),
        qrcodeFormat: z.enum(['image', 'base64', 'terminal']).optional().describe("二维码格式"),
        qrcodeOutputDest: z.string().optional().describe("二维码输出路径"),
        setting: z.object({
          es6: z.boolean().optional().describe("是否使用 ES6 转 ES5"),
          es7: z.boolean().optional().describe("是否使用 ES7 转 ES5"),
          minify: z.boolean().optional().describe("是否压缩代码"),
          codeProtect: z.boolean().optional().describe("是否代码保护"),
          autoPrefixWXSS: z.boolean().optional().describe("是否自动补全 WXSS")
        }).optional().describe("编译设置")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        category: "miniprogram"
      }
    },
    async ({ projectPath, desc, appid, privateKeyPath, privateKey, robot = 1, qrcodeFormat = 'terminal', qrcodeOutputDest, setting = {} }) => {
      try {
        // 动态导入 miniprogram-ci
        const ci = await import('miniprogram-ci');
        
        // 验证项目路径
        if (!existsSync(projectPath)) {
          throw new Error(`项目路径不存在: ${projectPath}`);
        }
        
        // 获取私钥
        let key: string;
        if (privateKey) {
          key = privateKey;
        } else if (privateKeyPath) {
          const keyPath = resolve(privateKeyPath);
          if (!existsSync(keyPath)) {
            throw new Error(`私钥文件不存在: ${keyPath}`);
          }
          key = keyPath;
        } else {
          const envKeyPath = process.env.MINIPROGRAM_PRIVATE_KEY_PATH;
          const envKey = process.env.MINIPROGRAM_PRIVATE_KEY;
          if (envKey) {
            key = envKey;
          } else if (envKeyPath) {
            key = envKeyPath;
          } else {
            throw new Error("未提供私钥，请设置 privateKey、privateKeyPath 参数或环境变量 MINIPROGRAM_PRIVATE_KEY、MINIPROGRAM_PRIVATE_KEY_PATH");
          }
        }
        
        // 创建项目对象
        const project = new ci.Project({
          appid: appid || '',
          type: 'miniProgram',
          projectPath: resolve(projectPath),
          privateKey: key,
          ignores: ['node_modules/**/*']
        });
        
        // 默认编译设置
        const previewSetting = {
          es6: true,
          es7: true,
          minify: true,
          codeProtect: false,
          autoPrefixWXSS: true,
          ...setting
        };
        
        // 预览配置
        const previewOptions: any = {
          project,
          desc,
          robot,
          setting: previewSetting,
          qrcodeFormat,
          onProgressUpdate: (data: any) => {
            console.log('预览进度:', data);
          }
        };
        
        if (qrcodeOutputDest) {
          previewOptions.qrcodeOutputDest = resolve(qrcodeOutputDest);
        }
        
        // 生成预览
        const previewResult = await ci.preview(previewOptions);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: "小程序预览生成成功",
                data: previewResult
              }, null, 2)
            }
          ]
        };
        
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                message: "小程序预览生成失败",
                error: error instanceof Error ? error.message : String(error)
              }, null, 2)
            }
          ]
        };
      }
    }
  );

  // 构建 npm
  server.registerTool?.(
    "buildMiniprogramNpm",
    {
      title: "构建小程序 npm",
      description: "构建小程序 npm 包，类似于微信开发者工具的构建 npm 功能",
      inputSchema: {
        projectPath: z.string().describe("小程序项目路径"),
        appid: z.string().optional().describe("小程序 AppID，如果不提供将从 project.config.json 中读取"),
        privateKeyPath: z.string().optional().describe("代码上传密钥路径，如果不提供将从环境变量 MINIPROGRAM_PRIVATE_KEY_PATH 中读取"),
        privateKey: z.string().optional().describe("代码上传密钥内容，如果不提供将从环境变量 MINIPROGRAM_PRIVATE_KEY 中读取"),
        robot: z.number().optional().describe("机器人编号，可选值：1-30")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        category: "miniprogram"
      }
    },
    async ({ projectPath, appid, privateKeyPath, privateKey, robot = 1 }) => {
      try {
        // 动态导入 miniprogram-ci
        const ci = await import('miniprogram-ci');
        
        // 验证项目路径
        if (!existsSync(projectPath)) {
          throw new Error(`项目路径不存在: ${projectPath}`);
        }
        
        // 获取私钥
        let key: string;
        if (privateKey) {
          key = privateKey;
        } else if (privateKeyPath) {
          const keyPath = resolve(privateKeyPath);
          if (!existsSync(keyPath)) {
            throw new Error(`私钥文件不存在: ${keyPath}`);
          }
          key = keyPath;
        } else {
          const envKeyPath = process.env.MINIPROGRAM_PRIVATE_KEY_PATH;
          const envKey = process.env.MINIPROGRAM_PRIVATE_KEY;
          if (envKey) {
            key = envKey;
          } else if (envKeyPath) {
            key = envKeyPath;
          } else {
            throw new Error("未提供私钥，请设置 privateKey、privateKeyPath 参数或环境变量 MINIPROGRAM_PRIVATE_KEY、MINIPROGRAM_PRIVATE_KEY_PATH");
          }
        }
        
        // 创建项目对象
        const project = new ci.Project({
          appid: appid || '',
          type: 'miniProgram',
          projectPath: resolve(projectPath),
          privateKey: key,
          ignores: ['node_modules/**/*']
        });
        
        // 构建 npm
        const buildResult = await ci.packNpm(project, {
          reporter: (infos: any) => {
            console.log('构建信息:', infos);
          }
        });
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: "小程序 npm 构建成功",
                data: buildResult
              }, null, 2)
            }
          ]
        };
        
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                message: "小程序 npm 构建失败",
                error: error instanceof Error ? error.message : String(error)
              }, null, 2)
            }
          ]
        };
      }
    }
  );

  // 获取小程序项目配置
  server.registerTool?.(
    "getMiniprogramProjectConfig",
    {
      title: "获取小程序项目配置",
      description: "获取小程序项目的配置信息，从 project.config.json 中读取",
      inputSchema: {
        projectPath: z.string().describe("小程序项目路径")
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
        category: "miniprogram"
      }
    },
    async ({ projectPath }) => {
      try {
        const { readFile } = await import('fs/promises');
        const configPath = resolve(projectPath, 'project.config.json');
        
        if (!existsSync(configPath)) {
          throw new Error(`项目配置文件不存在: ${configPath}`);
        }
        
        const configContent = await readFile(configPath, 'utf-8');
        const config = JSON.parse(configContent);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: "获取小程序项目配置成功",
                data: config
              }, null, 2)
            }
          ]
        };
        
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                message: "获取小程序项目配置失败",
                error: error instanceof Error ? error.message : String(error)
              }, null, 2)
            }
          ]
        };
      }
    }
  );
}