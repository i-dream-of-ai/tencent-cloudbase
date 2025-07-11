import { z } from "zod";
import { getCloudBaseManager } from '../cloudbase-manager.js'
import { ExtendedMcpServer } from '../server.js';

// 支持的服务类型
export const SUPPORTED_SERVICE_TYPES = [
  'web',
  'worker'
];

// 支持的 CPU 规格
export const SUPPORTED_CPU_SPECS = [
  '0.25',
  '0.5',
  '1',
  '2',
  '4',
  '8',
  '16'
];

// 支持的内存规格
export const SUPPORTED_MEMORY_SPECS = [
  '0.5Gi',
  '1Gi',
  '2Gi',
  '4Gi',
  '8Gi',
  '16Gi',
  '32Gi'
];

// 支持的流量配置类型
export const SUPPORTED_TRAFFIC_TYPES = [
  'FLOW',
  'URL_PARAMS'
];

export function registerCloudRunTools(server: ExtendedMcpServer) {
  // 获取 cloudBaseOptions，如果没有则为 undefined
  const cloudBaseOptions = server.cloudBaseOptions;

  // 创建闭包函数来获取 CloudBase Manager
  const getManager = () => getCloudBaseManager({ cloudBaseOptions });

  // getCloudRunServiceList - 获取云托管服务列表
  server.registerTool?.(
    "getCloudRunServiceList",
    {
      title: "获取云托管服务列表",
      description: "获取云托管服务列表",
      inputSchema: {
        offset: z.number().optional().describe("偏移量"),
        limit: z.number().optional().describe("返回数量限制")
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        category: "cloudrun"
      }
    },
    async ({ offset, limit }: { offset?: number; limit?: number }) => {
      const cloudbase = await getManager();
      const result = await cloudbase.cloudrun.getCloudRunServiceList(offset, limit);
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

  // createCloudRunService - 创建云托管服务
  server.registerTool?.(
    "createCloudRunService",
    {
      title: "创建云托管服务",
      description: "创建云托管服务",
      inputSchema: {
        serviceName: z.string().describe("服务名称"),
        serviceType: z.enum(SUPPORTED_SERVICE_TYPES as any).optional().describe("服务类型: web（网站类）或 worker（任务类），默认为 web"),
        description: z.string().optional().describe("服务描述"),
        isPublic: z.boolean().optional().describe("是否公网访问，默认为 true"),
        cpu: z.enum(SUPPORTED_CPU_SPECS as any).optional().describe("CPU 规格，默认为 0.25，可选值: " + SUPPORTED_CPU_SPECS.join(", ")),
        memory: z.enum(SUPPORTED_MEMORY_SPECS as any).optional().describe("内存规格，默认为 0.5Gi，可选值: " + SUPPORTED_MEMORY_SPECS.join(", ")),
        minReplicas: z.number().optional().describe("最小副本数，默认为 0"),
        maxReplicas: z.number().optional().describe("最大副本数，默认为 10"),
        containerPort: z.number().optional().describe("容器端口，默认为 8080"),
        envVariables: z.record(z.string()).optional().describe("环境变量"),
        customLogs: z.string().optional().describe("自定义日志路径"),
        initialDelaySeconds: z.number().optional().describe("初始延迟时间（秒）"),
        dockerfile: z.string().optional().describe("Dockerfile 内容"),
        buildDir: z.string().optional().describe("构建目录路径")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        category: "cloudrun"
      }
    },
    async (params: any) => {
      const cloudbase = await getManager();
      
      // 设置默认值
      const serviceConfig = {
        serviceName: params.serviceName,
        serviceType: params.serviceType || 'web',
        description: params.description || '',
        isPublic: params.isPublic !== undefined ? params.isPublic : true,
        cpu: params.cpu || '0.25',
        memory: params.memory || '0.5Gi',
        minReplicas: params.minReplicas || 0,
        maxReplicas: params.maxReplicas || 10,
        containerPort: params.containerPort || 8080,
        envVariables: params.envVariables || {},
        customLogs: params.customLogs || '',
        initialDelaySeconds: params.initialDelaySeconds || 0,
        dockerfile: params.dockerfile || '',
        buildDir: params.buildDir || ''
      };

      const result = await cloudbase.cloudrun.createCloudRunService(serviceConfig);
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

  // updateCloudRunService - 更新云托管服务
  server.registerTool?.(
    "updateCloudRunService",
    {
      title: "更新云托管服务",
      description: "更新云托管服务配置",
      inputSchema: {
        serviceName: z.string().describe("服务名称"),
        description: z.string().optional().describe("服务描述"),
        isPublic: z.boolean().optional().describe("是否公网访问"),
        cpu: z.enum(SUPPORTED_CPU_SPECS as any).optional().describe("CPU 规格，可选值: " + SUPPORTED_CPU_SPECS.join(", ")),
        memory: z.enum(SUPPORTED_MEMORY_SPECS as any).optional().describe("内存规格，可选值: " + SUPPORTED_MEMORY_SPECS.join(", ")),
        minReplicas: z.number().optional().describe("最小副本数"),
        maxReplicas: z.number().optional().describe("最大副本数"),
        containerPort: z.number().optional().describe("容器端口"),
        envVariables: z.record(z.string()).optional().describe("环境变量"),
        customLogs: z.string().optional().describe("自定义日志路径"),
        initialDelaySeconds: z.number().optional().describe("初始延迟时间（秒）")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        category: "cloudrun"
      }
    },
    async (params: any) => {
      const cloudbase = await getManager();
      const result = await cloudbase.cloudrun.updateCloudRunService(params);
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

  // deleteCloudRunService - 删除云托管服务
  server.registerTool?.(
    "deleteCloudRunService",
    {
      title: "删除云托管服务",
      description: "删除云托管服务",
      inputSchema: {
        serviceName: z.string().describe("服务名称")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
        category: "cloudrun"
      }
    },
    async ({ serviceName }: { serviceName: string }) => {
      const cloudbase = await getManager();
      const result = await cloudbase.cloudrun.deleteCloudRunService(serviceName);
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

  // getCloudRunServiceDetail - 获取云托管服务详情
  server.registerTool?.(
    "getCloudRunServiceDetail",
    {
      title: "获取云托管服务详情",
      description: "获取云托管服务详情",
      inputSchema: {
        serviceName: z.string().describe("服务名称")
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        category: "cloudrun"
      }
    },
    async ({ serviceName }: { serviceName: string }) => {
      const cloudbase = await getManager();
      const result = await cloudbase.cloudrun.getCloudRunServiceDetail(serviceName);
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

  // createCloudRunVersion - 创建云托管服务版本
  server.registerTool?.(
    "createCloudRunVersion",
    {
      title: "创建云托管服务版本",
      description: "创建云托管服务版本",
      inputSchema: {
        serviceName: z.string().describe("服务名称"),
        uploadType: z.enum(['package', 'image', 'repository']).describe("上传类型: package（本地代码包）、image（镜像）或 repository（代码仓库）"),
        flowRatio: z.number().optional().describe("流量比例，0-100，默认为 0"),
        cpu: z.enum(SUPPORTED_CPU_SPECS as any).optional().describe("CPU 规格，可选值: " + SUPPORTED_CPU_SPECS.join(", ")),
        memory: z.enum(SUPPORTED_MEMORY_SPECS as any).optional().describe("内存规格，可选值: " + SUPPORTED_MEMORY_SPECS.join(", ")),
        minReplicas: z.number().optional().describe("最小副本数"),
        maxReplicas: z.number().optional().describe("最大副本数"),
        containerPort: z.number().optional().describe("容器端口"),
        envVariables: z.record(z.string()).optional().describe("环境变量"),
        customLogs: z.string().optional().describe("自定义日志路径"),
        initialDelaySeconds: z.number().optional().describe("初始延迟时间（秒）"),
        dockerfile: z.string().optional().describe("Dockerfile 内容"),
        buildDir: z.string().optional().describe("构建目录路径"),
        codeDetail: z.object({
          name: z.object({
            packageName: z.string().optional().describe("代码包名称"),
            packageVersion: z.string().optional().describe("代码包版本")
          }).optional(),
          imageInfo: z.object({
            imageType: z.enum(['personal', 'tcr']).optional().describe("镜像类型"),
            imageUrl: z.string().optional().describe("镜像地址"),
            registryCredential: z.object({
              username: z.string().optional().describe("镜像仓库用户名"),
              password: z.string().optional().describe("镜像仓库密码")
            }).optional()
          }).optional(),
          repositoryInfo: z.object({
            source: z.string().optional().describe("仓库来源"),
            url: z.string().optional().describe("仓库地址"),
            branch: z.string().optional().describe("分支名称")
          }).optional()
        }).optional().describe("代码详情")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        category: "cloudrun"
      }
    },
    async (params: any) => {
      const cloudbase = await getManager();
      const result = await cloudbase.cloudrun.createCloudRunVersion(params);
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

  // getCloudRunVersionList - 获取云托管服务版本列表
  server.registerTool?.(
    "getCloudRunVersionList",
    {
      title: "获取云托管服务版本列表",
      description: "获取云托管服务版本列表",
      inputSchema: {
        serviceName: z.string().describe("服务名称"),
        offset: z.number().optional().describe("偏移量"),
        limit: z.number().optional().describe("返回数量限制")
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        category: "cloudrun"
      }
    },
    async ({ serviceName, offset, limit }: { serviceName: string; offset?: number; limit?: number }) => {
      const cloudbase = await getManager();
      const result = await cloudbase.cloudrun.getCloudRunVersionList(serviceName, offset, limit);
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

  // deleteCloudRunVersion - 删除云托管服务版本
  server.registerTool?.(
    "deleteCloudRunVersion",
    {
      title: "删除云托管服务版本",
      description: "删除云托管服务版本",
      inputSchema: {
        serviceName: z.string().describe("服务名称"),
        versionName: z.string().describe("版本名称")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
        category: "cloudrun"
      }
    },
    async ({ serviceName, versionName }: { serviceName: string; versionName: string }) => {
      const cloudbase = await getManager();
      const result = await cloudbase.cloudrun.deleteCloudRunVersion(serviceName, versionName);
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

  // updateCloudRunVersionFlowRatio - 更新云托管服务版本流量配置
  server.registerTool?.(
    "updateCloudRunVersionFlowRatio",
    {
      title: "更新云托管服务版本流量配置",
      description: "更新云托管服务版本流量配置",
      inputSchema: {
        serviceName: z.string().describe("服务名称"),
        versionFlowItems: z.array(z.object({
          versionName: z.string().describe("版本名称"),
          flowRatio: z.number().describe("流量比例，0-100"),
          urlParam: z.object({
            key: z.string().describe("URL 参数 key"),
            value: z.string().describe("URL 参数 value")
          }).optional().describe("URL 参数匹配规则")
        })).describe("版本流量配置列表")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        category: "cloudrun"
      }
    },
    async ({ serviceName, versionFlowItems }: { serviceName: string; versionFlowItems: any[] }) => {
      const cloudbase = await getManager();
      const result = await cloudbase.cloudrun.updateCloudRunVersionFlowRatio(serviceName, versionFlowItems);
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

  // getCloudRunServiceLogs - 获取云托管服务日志
  server.registerTool?.(
    "getCloudRunServiceLogs",
    {
      title: "获取云托管服务日志",
      description: "获取云托管服务日志",
      inputSchema: {
        serviceName: z.string().describe("服务名称"),
        versionName: z.string().optional().describe("版本名称"),
        startTime: z.string().optional().describe("开始时间，格式：YYYY-MM-DD HH:mm:ss"),
        endTime: z.string().optional().describe("结束时间，格式：YYYY-MM-DD HH:mm:ss"),
        limit: z.number().optional().describe("返回日志条数限制"),
        orderBy: z.enum(['asc', 'desc']).optional().describe("排序方式: asc（升序）或 desc（降序）"),
        orderType: z.enum(['timestamp']).optional().describe("排序字段: timestamp（时间戳）")
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        category: "cloudrun"
      }
    },
    async (params: any) => {
      const cloudbase = await getManager();
      const result = await cloudbase.cloudrun.getCloudRunServiceLogs(params);
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

  // getCloudRunServiceEvent - 获取云托管服务事件
  server.registerTool?.(
    "getCloudRunServiceEvent",
    {
      title: "获取云托管服务事件",
      description: "获取云托管服务事件",
      inputSchema: {
        serviceName: z.string().describe("服务名称"),
        versionName: z.string().optional().describe("版本名称"),
        startTime: z.string().optional().describe("开始时间，格式：YYYY-MM-DD HH:mm:ss"),
        endTime: z.string().optional().describe("结束时间，格式：YYYY-MM-DD HH:mm:ss"),
        limit: z.number().optional().describe("返回事件条数限制")
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        category: "cloudrun"
      }
    },
    async (params: any) => {
      const cloudbase = await getManager();
      const result = await cloudbase.cloudrun.getCloudRunServiceEvent(params);
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