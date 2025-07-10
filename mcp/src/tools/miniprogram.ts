import { z } from "zod";
import { ExtendedMcpServer } from "../server.js";
import { info, warn, error } from "../utils/logger.js";
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

// 动态导入 miniprogram-ci 以避免在没有安装时出错
let ci: any;

async function loadMiniprogramCi() {
  if (ci) return ci;
  
  try {
    ci = await import('miniprogram-ci');
    return ci;
  } catch (importError) {
    warn("miniprogram-ci not installed. Please install it with: npm install miniprogram-ci");
    throw new Error("miniprogram-ci 未安装，请先安装: npm install miniprogram-ci");
  }
}

// 配置辅助函数
function getMiniprogramConfig() {
  const privateKey = process.env.MINIPROGRAM_PRIVATE_KEY;
  const privateKeyPath = process.env.MINIPROGRAM_PRIVATE_KEY_PATH;
  
  if (!privateKey && !privateKeyPath) {
    throw new Error("请设置环境变量 MINIPROGRAM_PRIVATE_KEY 或 MINIPROGRAM_PRIVATE_KEY_PATH");
  }
  
  return {
    privateKey,
    privateKeyPath
  };
}

// 创建项目实例
async function createProject(appid: string, projectPath: string, type: string = 'miniProgram'): Promise<any> {
  const ci = await loadMiniprogramCi();
  
  const config = getMiniprogramConfig();
  
  const projectConfig: any = {
    appid,
    type,
    projectPath,
    ignores: ['node_modules/**/*']
  };
  
  // 优先使用私钥内容，否则使用私钥路径
  if (config.privateKey) {
    projectConfig.privateKey = config.privateKey;
  } else if (config.privateKeyPath) {
    projectConfig.privateKeyPath = config.privateKeyPath;
  }
  
  return new ci.Project(projectConfig);
}

// 上传小程序代码
export const uploadMiniprogramCodeSchema = z.object({
  appid: z.string().describe("小程序的 AppID"),
  projectPath: z.string().describe("项目路径"),
  version: z.string().describe("版本号"),
  desc: z.string().describe("上传描述"),
  robot: z.number().min(1).max(30).optional().describe("机器人编号(1-30)，默认为1"),
  setting: z.object({
    es6: z.boolean().optional().default(true),
    es7: z.boolean().optional().default(true),
    minify: z.boolean().optional().default(true),
    codeProtect: z.boolean().optional().default(true),
    autoPrefixWXSS: z.boolean().optional().default(true)
  }).optional()
});

async function uploadMiniprogramCode(args: z.infer<typeof uploadMiniprogramCodeSchema>) {
  info(`开始上传小程序代码: ${args.appid}`);
  
  try {
    const ci = await loadMiniprogramCi();
    const project = await createProject(args.appid, args.projectPath);
    
    const uploadResult = await ci.upload({
      project,
      version: args.version,
      desc: args.desc,
      setting: args.setting || {
        es6: true,
        es7: true,
        minify: true,
        codeProtect: true,
        autoPrefixWXSS: true
      },
      onProgressUpdate: (progress: number) => {
        info(`上传进度: ${progress}%`);
      },
      robot: args.robot || 1
    });
    
    info(`小程序代码上传成功: ${args.appid}`);
    
    return {
      success: true,
      data: uploadResult,
      message: `小程序 ${args.appid} 版本 ${args.version} 上传成功`
    };
  } catch (err) {
    error(`小程序代码上传失败: ${err}`);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

// 预览小程序代码
export const previewMiniprogramCodeSchema = z.object({
  appid: z.string().describe("小程序的 AppID"),
  projectPath: z.string().describe("项目路径"),
  desc: z.string().describe("预览描述"),
  robot: z.number().min(1).max(30).optional().describe("机器人编号(1-30)，默认为1"),
  qrcodeFormat: z.enum(['image', 'base64', 'terminal']).optional().describe("二维码格式，默认为terminal"),
  qrcodeOutputDest: z.string().optional().describe("二维码输出路径(当格式为image时)"),
  setting: z.object({
    es6: z.boolean().optional().default(true),
    es7: z.boolean().optional().default(true),
    minify: z.boolean().optional().default(false),
    codeProtect: z.boolean().optional().default(false),
    autoPrefixWXSS: z.boolean().optional().default(true)
  }).optional()
});

async function previewMiniprogramCode(args: z.infer<typeof previewMiniprogramCodeSchema>) {
  info(`开始生成小程序预览: ${args.appid}`);
  
  try {
    const ci = await loadMiniprogramCi();
    const project = await createProject(args.appid, args.projectPath);
    
    const previewConfig: any = {
      project,
      desc: args.desc,
      setting: args.setting || {
        es6: true,
        es7: true,
        minify: false,
        codeProtect: false,
        autoPrefixWXSS: true
      },
      qrcodeFormat: args.qrcodeFormat || 'terminal',
      onProgressUpdate: (progress: number) => {
        info(`预览生成进度: ${progress}%`);
      },
      robot: args.robot || 1
    };
    
    if (args.qrcodeOutputDest) {
      previewConfig.qrcodeOutputDest = args.qrcodeOutputDest;
    }
    
    const previewResult = await ci.preview(previewConfig);
    
    info(`小程序预览生成成功: ${args.appid}`);
    
    return {
      success: true,
      data: previewResult,
      message: `小程序 ${args.appid} 预览生成成功`
    };
  } catch (err) {
    error(`小程序预览生成失败: ${err}`);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

// 构建小程序 npm
export const buildMiniprogramNpmSchema = z.object({
  appid: z.string().describe("小程序的 AppID"),
  projectPath: z.string().describe("项目路径"),
  ignoreDevDependencies: z.boolean().optional().default(true).describe("是否忽略 devDependencies"),
  ignoreUploadUnusedFiles: z.boolean().optional().default(true).describe("是否忽略未使用的文件")
});

async function buildMiniprogramNpm(args: z.infer<typeof buildMiniprogramNpmSchema>) {
  info(`开始构建小程序 npm: ${args.appid}`);
  
  try {
    const ci = await loadMiniprogramCi();
    const project = await createProject(args.appid, args.projectPath);
    
    const packResult = await ci.packNpm({
      project,
      options: {
        ignoreDevDependencies: args.ignoreDevDependencies,
        ignoreUploadUnusedFiles: args.ignoreUploadUnusedFiles
      },
      reporter: (infos: any) => {
        info(`构建信息: ${JSON.stringify(infos)}`);
      }
    });
    
    info(`小程序 npm 构建成功: ${args.appid}`);
    
    return {
      success: true,
      data: packResult,
      message: `小程序 ${args.appid} npm 构建成功`
    };
  } catch (err) {
    error(`小程序 npm 构建失败: ${err}`);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

// 获取小程序项目配置
export const getMiniprogramProjectConfigSchema = z.object({
  projectPath: z.string().describe("项目路径")
});

async function getMiniprogramProjectConfig(args: z.infer<typeof getMiniprogramProjectConfigSchema>) {
  info(`获取小程序项目配置: ${args.projectPath}`);
  
  try {
    const projectConfigPath = join(args.projectPath, 'project.config.json');
    const projectPrivateConfigPath = join(args.projectPath, 'project.private.config.json');
    
    const result: any = {
      projectPath: args.projectPath,
      hasProjectConfig: existsSync(projectConfigPath),
      hasPrivateConfig: existsSync(projectPrivateConfigPath)
    };
    
    if (result.hasProjectConfig) {
      try {
        const projectConfig = JSON.parse(readFileSync(projectConfigPath, 'utf-8'));
        result.projectConfig = projectConfig;
      } catch (err) {
        warn(`读取 project.config.json 失败: ${err}`);
      }
    }
    
    if (result.hasPrivateConfig) {
      try {
        const privateConfig = JSON.parse(readFileSync(projectPrivateConfigPath, 'utf-8'));
        result.privateConfig = privateConfig;
      } catch (err) {
        warn(`读取 project.private.config.json 失败: ${err}`);
      }
    }
    
    info(`小程序项目配置获取成功: ${args.projectPath}`);
    
    return {
      success: true,
      data: result,
      message: `小程序项目配置获取成功`
    };
  } catch (err) {
    error(`获取小程序项目配置失败: ${err}`);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

// 注册小程序工具
export function registerMiniprogramTools(server: ExtendedMcpServer) {
  // 上传小程序代码
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    if (name === "uploadMiniprogramCode") {
      const parsed = uploadMiniprogramCodeSchema.safeParse(args);
      if (!parsed.success) {
        throw new Error(`Invalid arguments for uploadMiniprogramCode: ${parsed.error.message}`);
      }
      const result = await uploadMiniprogramCode(parsed.data);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
    
    if (name === "previewMiniprogramCode") {
      const parsed = previewMiniprogramCodeSchema.safeParse(args);
      if (!parsed.success) {
        throw new Error(`Invalid arguments for previewMiniprogramCode: ${parsed.error.message}`);
      }
      const result = await previewMiniprogramCode(parsed.data);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
    
    if (name === "buildMiniprogramNpm") {
      const parsed = buildMiniprogramNpmSchema.safeParse(args);
      if (!parsed.success) {
        throw new Error(`Invalid arguments for buildMiniprogramNpm: ${parsed.error.message}`);
      }
      const result = await buildMiniprogramNpm(parsed.data);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
    
    if (name === "getMiniprogramProjectConfig") {
      const parsed = getMiniprogramProjectConfigSchema.safeParse(args);
      if (!parsed.success) {
        throw new Error(`Invalid arguments for getMiniprogramProjectConfig: ${parsed.error.message}`);
      }
      const result = await getMiniprogramProjectConfig(parsed.data);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
    
    return { content: [] };
  });

  // 注册工具定义
  server.setRequestHandler({ method: "tools/list" }, async () => {
    return {
      tools: [
        {
          name: "uploadMiniprogramCode",
          description: "上传小程序代码到微信平台",
          inputSchema: uploadMiniprogramCodeSchema
        },
        {
          name: "previewMiniprogramCode", 
          description: "预览小程序代码并生成二维码",
          inputSchema: previewMiniprogramCodeSchema
        },
        {
          name: "buildMiniprogramNpm",
          description: "构建小程序 npm 包",
          inputSchema: buildMiniprogramNpmSchema
        },
        {
          name: "getMiniprogramProjectConfig",
          description: "获取小程序项目配置信息",
          inputSchema: getMiniprogramProjectConfigSchema
        }
      ]
    };
  });
}