import { z } from "zod";
import { ExtendedMcpServer } from "../server.js";
import { error, info } from "../utils/logger.js";

/**
 * 获取小程序私钥配置
 */
function getPrivateKeyConfig(): { privateKey?: string; privateKeyPath?: string } {
  const privateKey = process.env.MINIPROGRAM_PRIVATE_KEY;
  const privateKeyPath = process.env.MINIPROGRAM_PRIVATE_KEY_PATH;
  
  if (!privateKey && !privateKeyPath) {
    throw new Error("需要设置 MINIPROGRAM_PRIVATE_KEY 或 MINIPROGRAM_PRIVATE_KEY_PATH 环境变量");
  }
  
  return { privateKey, privateKeyPath };
}

/**
 * 上传小程序代码
 */
async function uploadMiniprogramCode(args: {
  appId: string;
  projectPath: string;
  version: string;
  desc?: string;
  setting?: Record<string, any>;
  robot?: number;
}) {
  try {
    // 动态导入 miniprogram-ci
    const ci = await import("miniprogram-ci");
    
    const { privateKey, privateKeyPath } = getPrivateKeyConfig();
    
    const project = new ci.Project({
      appid: args.appId,
      type: "miniProgram",
      projectPath: args.projectPath,
      privateKeyPath: privateKeyPath,
      privateKey: privateKey,
      ignores: ["node_modules/**/*"],
    });

    const uploadResult = await ci.upload({
      project,
      version: args.version,
      desc: args.desc || `上传于 ${new Date().toLocaleString()}`,
      setting: args.setting,
      robot: args.robot || 1,
    });

    info("小程序代码上传成功", uploadResult);
    return {
      success: true,
      result: uploadResult,
      message: "小程序代码上传成功"
    };
  } catch (err) {
    error("小程序代码上传失败", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

/**
 * 预览小程序代码
 */
async function previewMiniprogramCode(args: {
  appId: string;
  projectPath: string;
  desc?: string;
  setting?: Record<string, any>;
  qrcodeFormat?: "terminal" | "base64" | "image";
  qrcodeOutputDest?: string;
  robot?: number;
}) {
  try {
    const ci = await import("miniprogram-ci");
    
    const { privateKey, privateKeyPath } = getPrivateKeyConfig();
    
    const project = new ci.Project({
      appid: args.appId,
      type: "miniProgram",
      projectPath: args.projectPath,
      privateKeyPath: privateKeyPath,
      privateKey: privateKey,
      ignores: ["node_modules/**/*"],
    });

    const previewResult = await ci.preview({
      project,
      desc: args.desc || `预览于 ${new Date().toLocaleString()}`,
      setting: args.setting,
      qrcodeFormat: args.qrcodeFormat || "terminal",
      qrcodeOutputDest: args.qrcodeOutputDest,
      robot: args.robot || 1,
    });

    info("小程序代码预览成功", previewResult);
    return {
      success: true,
      result: previewResult,
      message: "小程序代码预览成功"
    };
  } catch (err) {
    error("小程序代码预览失败", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

/**
 * 构建小程序 npm
 */
async function buildMiniprogramNpm(args: {
  appId: string;
  projectPath: string;
  robot?: number;
}) {
  try {
    const ci = await import("miniprogram-ci");
    
    const { privateKey, privateKeyPath } = getPrivateKeyConfig();
    
    const project = new ci.Project({
      appid: args.appId,
      type: "miniProgram",
      projectPath: args.projectPath,
      privateKeyPath: privateKeyPath,
      privateKey: privateKey,
      ignores: ["node_modules/**/*"],
    });

    const buildResult = await ci.packNpm(project, {
      reporter: (infos) => {
        info("构建 npm 包", infos);
      },
      robot: args.robot || 1,
    });

    info("小程序 npm 构建成功", buildResult);
    return {
      success: true,
      result: buildResult,
      message: "小程序 npm 构建成功"
    };
  } catch (err) {
    error("小程序 npm 构建失败", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

/**
 * 获取小程序项目配置
 */
async function getMiniprogramProjectConfig(args: {
  projectPath: string;
}) {
  try {
    const fs = await import("fs");
    const path = await import("path");
    
    const projectConfigPath = path.join(args.projectPath, "project.config.json");
    const projectPrivateConfigPath = path.join(args.projectPath, "project.private.config.json");
    
    const configs: any = {};
    
    if (fs.existsSync(projectConfigPath)) {
      const configContent = fs.readFileSync(projectConfigPath, "utf-8");
      configs.projectConfig = JSON.parse(configContent);
    }
    
    if (fs.existsSync(projectPrivateConfigPath)) {
      const privateConfigContent = fs.readFileSync(projectPrivateConfigPath, "utf-8");
      configs.projectPrivateConfig = JSON.parse(privateConfigContent);
    }

    return {
      success: true,
      result: configs,
      message: "获取小程序项目配置成功"
    };
  } catch (err) {
    error("获取小程序项目配置失败", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

/**
 * Register miniprogram tools with the MCP server
 */
export function registerMiniprogramTools(server: ExtendedMcpServer) {
  // 上传小程序代码
  server.setRequestHandler("tools/call", async (request) => {
    if (request.params.name === "uploadMiniprogramCode") {
      const args = z.object({
        appId: z.string().describe("小程序 AppId"),
        projectPath: z.string().describe("小程序项目路径"),
        version: z.string().describe("版本号"),
        desc: z.string().optional().describe("版本描述"),
        setting: z.record(z.any()).optional().describe("项目配置"),
        robot: z.number().optional().describe("机器人编号，默认为1"),
      }).parse(request.params.arguments);
      
      const result = await uploadMiniprogramCode(args);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
    
    // 预览小程序代码
    if (request.params.name === "previewMiniprogramCode") {
      const args = z.object({
        appId: z.string().describe("小程序 AppId"),
        projectPath: z.string().describe("小程序项目路径"),
        desc: z.string().optional().describe("预览描述"),
        setting: z.record(z.any()).optional().describe("项目配置"),
        qrcodeFormat: z.enum(["terminal", "base64", "image"]).optional().describe("二维码格式"),
        qrcodeOutputDest: z.string().optional().describe("二维码输出路径"),
        robot: z.number().optional().describe("机器人编号，默认为1"),
      }).parse(request.params.arguments);
      
      const result = await previewMiniprogramCode(args);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
    
    // 构建小程序 npm
    if (request.params.name === "buildMiniprogramNpm") {
      const args = z.object({
        appId: z.string().describe("小程序 AppId"),
        projectPath: z.string().describe("小程序项目路径"),
        robot: z.number().optional().describe("机器人编号，默认为1"),
      }).parse(request.params.arguments);
      
      const result = await buildMiniprogramNpm(args);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
    
    // 获取小程序项目配置
    if (request.params.name === "getMiniprogramProjectConfig") {
      const args = z.object({
        projectPath: z.string().describe("小程序项目路径"),
      }).parse(request.params.arguments);
      
      const result = await getMiniprogramProjectConfig(args);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
    
    return { content: [{ type: "text", text: "未知的工具调用" }] };
  });

  // 注册工具列表
  server.setRequestHandler("tools/list", async (request) => {
    const existingTools = await server.request(request);
    const miniprogramTools = [
      {
        name: "uploadMiniprogramCode",
        description: "上传小程序代码到微信平台",
        inputSchema: {
          type: "object",
          properties: {
            appId: { type: "string", description: "小程序 AppId" },
            projectPath: { type: "string", description: "小程序项目路径" },
            version: { type: "string", description: "版本号" },
            desc: { type: "string", description: "版本描述" },
            setting: { type: "object", description: "项目配置" },
            robot: { type: "number", description: "机器人编号，默认为1" },
          },
          required: ["appId", "projectPath", "version"],
        },
      },
      {
        name: "previewMiniprogramCode",
        description: "预览小程序代码，生成二维码",
        inputSchema: {
          type: "object",
          properties: {
            appId: { type: "string", description: "小程序 AppId" },
            projectPath: { type: "string", description: "小程序项目路径" },
            desc: { type: "string", description: "预览描述" },
            setting: { type: "object", description: "项目配置" },
            qrcodeFormat: { type: "string", enum: ["terminal", "base64", "image"], description: "二维码格式" },
            qrcodeOutputDest: { type: "string", description: "二维码输出路径" },
            robot: { type: "number", description: "机器人编号，默认为1" },
          },
          required: ["appId", "projectPath"],
        },
      },
      {
        name: "buildMiniprogramNpm",
        description: "构建小程序 npm 包",
        inputSchema: {
          type: "object",
          properties: {
            appId: { type: "string", description: "小程序 AppId" },
            projectPath: { type: "string", description: "小程序项目路径" },
            robot: { type: "number", description: "机器人编号，默认为1" },
          },
          required: ["appId", "projectPath"],
        },
      },
      {
        name: "getMiniprogramProjectConfig",
        description: "获取小程序项目配置信息",
        inputSchema: {
          type: "object",
          properties: {
            projectPath: { type: "string", description: "小程序项目路径" },
          },
          required: ["projectPath"],
        },
      },
    ];
    
    return {
      tools: [...(existingTools.tools || []), ...miniprogramTools],
    };
  });
}