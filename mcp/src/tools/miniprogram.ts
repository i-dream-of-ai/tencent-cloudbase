import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { ExtendedMcpServer } from '../server.js';

// 小程序配置接口
interface MiniprogramConfig {
  appid: string;
  projectPath: string;
  privateKeyPath?: string;
  privateKey?: string;
  setting?: any;
  qrcodeFormat?: 'terminal' | 'base64' | 'image';
  qrcodeOutputDest?: string;
  pagePath?: string;
  searchQuery?: string;
  scene?: number;
  robot?: number;
  version?: string;
  desc?: string;
}

// 动态导入 miniprogram-ci，避免依赖问题
async function getMiniprogramCi() {
  try {
    const ci = await import('miniprogram-ci');
    return ci.default;
  } catch (error) {
    throw new Error('miniprogram-ci 依赖未安装。请运行: npm install miniprogram-ci');
  }
}

// 获取私钥内容
function getPrivateKey(): string {
  const privateKey = process.env.MINIPROGRAM_PRIVATE_KEY;
  const privateKeyPath = process.env.MINIPROGRAM_PRIVATE_KEY_PATH;
  
  if (privateKey) {
    return privateKey;
  }
  
  if (privateKeyPath && fs.existsSync(privateKeyPath)) {
    return fs.readFileSync(privateKeyPath, 'utf8');
  }
  
  throw new Error('请设置环境变量 MINIPROGRAM_PRIVATE_KEY 或 MINIPROGRAM_PRIVATE_KEY_PATH');
}

// 读取小程序项目配置
function getProjectConfig(projectPath: string): any {
  const configPath = path.join(projectPath, 'project.config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`项目配置文件不存在: ${configPath}`);
  }
  
  const configContent = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(configContent);
}

// 创建小程序项目实例
async function createProject(projectPath: string, appid?: string): Promise<any> {
  const ci = await getMiniprogramCi();
  const privateKey = getPrivateKey();
  const projectConfig = getProjectConfig(projectPath);
  
  const finalAppid = appid || projectConfig.appid;
  if (!finalAppid) {
    throw new Error('未找到小程序 appid，请在 project.config.json 中配置或传入参数');
  }
  
  return new ci.Project({
    appid: finalAppid,
    type: 'miniProgram',
    projectPath: projectPath,
    privateKeyPath: '',
    privateKey: privateKey,
    ignores: ['node_modules/**/*']
  });
}

// 注册小程序工具
export function registerMiniprogramTools(server: ExtendedMcpServer) {
  // 上传小程序代码
  server.tool(
    'uploadMiniprogramCode',
    '上传小程序代码到微信平台',
    {
      projectPath: z.string().describe("小程序项目路径"),
      appid: z.string().optional().describe("小程序 appid，如果不提供则从 project.config.json 中读取"),
      version: z.string().optional().describe("版本号，默认使用时间戳"),
      desc: z.string().optional().describe("版本描述"),
      setting: z.object({}).optional().describe("编译设置"),
      robot: z.number().optional().describe("机器人编号，1-30，默认为 1")
    },
    async (args) => {
      try {
        const ci = await getMiniprogramCi();
        const project = await createProject(args.projectPath, args.appid);
        
        const uploadResult = await ci.upload({
          project,
          version: args.version || new Date().getTime().toString(),
          desc: args.desc || '通过 MCP 工具上传',
          setting: args.setting || {},
          robot: args.robot || 1,
          onProgressUpdate: (progress: any) => {
            console.log(`上传进度: ${progress.message}`);
          }
        });
        
        return {
          success: true,
          message: '小程序代码上传成功',
          data: uploadResult
        };
      } catch (error) {
        return {
          success: false,
          message: `上传失败: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  );

  // 预览小程序代码
  server.tool(
    'previewMiniprogramCode',
    '预览小程序代码并生成二维码',
    {
      projectPath: z.string().describe("小程序项目路径"),
      appid: z.string().optional().describe("小程序 appid，如果不提供则从 project.config.json 中读取"),
      qrcodeFormat: z.enum(['terminal', 'base64', 'image']).optional().describe("二维码格式，默认为 terminal"),
      qrcodeOutputDest: z.string().optional().describe("二维码保存路径（当格式为 image 时）"),
      pagePath: z.string().optional().describe("预览页面路径"),
      searchQuery: z.string().optional().describe("页面参数"),
      scene: z.number().optional().describe("场景值"),
      robot: z.number().optional().describe("机器人编号，1-30，默认为 1")
    },
    async (args) => {
      try {
        const ci = await getMiniprogramCi();
        const project = await createProject(args.projectPath, args.appid);
        
        const previewResult = await ci.preview({
          project,
          desc: '通过 MCP 工具预览',
          setting: {},
          qrcodeFormat: args.qrcodeFormat || 'terminal',
          qrcodeOutputDest: args.qrcodeOutputDest,
          pagePath: args.pagePath,
          searchQuery: args.searchQuery,
          scene: args.scene,
          robot: args.robot || 1,
          onProgressUpdate: (progress: any) => {
            console.log(`预览进度: ${progress.message}`);
          }
        });
        
        return {
          success: true,
          message: '小程序预览成功',
          data: previewResult
        };
      } catch (error) {
        return {
          success: false,
          message: `预览失败: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  );

  // 构建小程序 npm
  server.tool(
    'buildMiniprogramNpm',
    '构建小程序 npm 包',
    {
      projectPath: z.string().describe("小程序项目路径"),
      appid: z.string().optional().describe("小程序 appid，如果不提供则从 project.config.json 中读取"),
      robot: z.number().optional().describe("机器人编号，1-30，默认为 1")
    },
    async (args) => {
      try {
        const ci = await getMiniprogramCi();
        const project = await createProject(args.projectPath, args.appid);
        
        const buildResult = await ci.packNpm(project, {
          reporter: (infos: any) => {
            console.log(infos);
          }
        });
        
        return {
          success: true,
          message: '小程序 npm 构建成功',
          data: buildResult
        };
      } catch (error) {
        return {
          success: false,
          message: `构建失败: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  );

  // 获取小程序项目配置
  server.tool(
    'getMiniprogramProjectConfig',
    '获取小程序项目配置信息',
    {
      projectPath: z.string().describe("小程序项目路径")
    },
    async (args) => {
      try {
        const projectConfig = getProjectConfig(args.projectPath);
        
        return {
          success: true,
          message: '获取项目配置成功',
          data: projectConfig
        };
      } catch (error) {
        return {
          success: false,
          message: `获取配置失败: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  );
}