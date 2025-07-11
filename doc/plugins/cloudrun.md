# 云托管插件

云托管插件提供了云托管后端应用的完整管理功能，包括服务创建、版本管理、流量配置、监控运维等。

## 配置

### 环境变量

```bash
# 启用云托管插件
export CLOUDBASE_MCP_PLUGINS_ENABLED="env,database,functions,hosting,storage,setup,interactive,rag,gateway,download,cloudrun"
```

### MCP 配置

```json
{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["-y", "@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "CLOUDBASE_MCP_PLUGINS_ENABLED": "env,database,functions,hosting,storage,setup,interactive,rag,gateway,download,cloudrun"
      }
    }
  }
}
```

## 工具

### getCloudRunServiceList

获取云托管服务列表

**参数：**
- `offset`: 偏移量（可选）
- `limit`: 返回数量限制（可选）

### createCloudRunService

创建云托管服务

**参数：**
- `serviceName`: 服务名称
- `serviceType`: 服务类型 web/worker（可选，默认 web）
- `description`: 服务描述（可选）
- `isPublic`: 是否公网访问（可选，默认 true）
- `cpu`: CPU 规格（可选，默认 0.25）
- `memory`: 内存规格（可选，默认 0.5Gi）
- `minReplicas`: 最小副本数（可选，默认 0）
- `maxReplicas`: 最大副本数（可选，默认 10）
- `containerPort`: 容器端口（可选，默认 8080）
- `envVariables`: 环境变量（可选）
- `customLogs`: 自定义日志路径（可选）
- `initialDelaySeconds`: 初始延迟时间（可选）
- `dockerfile`: Dockerfile 内容（可选）
- `buildDir`: 构建目录路径（可选）

### updateCloudRunService

更新云托管服务配置

**参数：**
- `serviceName`: 服务名称
- `description`: 服务描述（可选）
- `isPublic`: 是否公网访问（可选）
- `cpu`: CPU 规格（可选）
- `memory`: 内存规格（可选）
- `minReplicas`: 最小副本数（可选）
- `maxReplicas`: 最大副本数（可选）
- `containerPort`: 容器端口（可选）
- `envVariables`: 环境变量（可选）
- `customLogs`: 自定义日志路径（可选）
- `initialDelaySeconds`: 初始延迟时间（可选）

### deleteCloudRunService

删除云托管服务

**参数：**
- `serviceName`: 服务名称

### getCloudRunServiceDetail

获取云托管服务详情

**参数：**
- `serviceName`: 服务名称

### createCloudRunVersion

创建云托管服务版本

**参数：**
- `serviceName`: 服务名称
- `uploadType`: 上传类型 package/image/repository
- `flowRatio`: 流量比例 0-100（可选，默认 0）
- `cpu`: CPU 规格（可选）
- `memory`: 内存规格（可选）
- `minReplicas`: 最小副本数（可选）
- `maxReplicas`: 最大副本数（可选）
- `containerPort`: 容器端口（可选）
- `envVariables`: 环境变量（可选）
- `customLogs`: 自定义日志路径（可选）
- `initialDelaySeconds`: 初始延迟时间（可选）
- `dockerfile`: Dockerfile 内容（可选）
- `buildDir`: 构建目录路径（可选）
- `codeDetail`: 代码详情（可选）

### getCloudRunVersionList

获取云托管服务版本列表

**参数：**
- `serviceName`: 服务名称
- `offset`: 偏移量（可选）
- `limit`: 返回数量限制（可选）

### deleteCloudRunVersion

删除云托管服务版本

**参数：**
- `serviceName`: 服务名称
- `versionName`: 版本名称

### updateCloudRunVersionFlowRatio

更新云托管服务版本流量配置

**参数：**
- `serviceName`: 服务名称
- `versionFlowItems`: 版本流量配置列表

### getCloudRunServiceLogs

获取云托管服务日志

**参数：**
- `serviceName`: 服务名称
- `versionName`: 版本名称（可选）
- `startTime`: 开始时间（可选）
- `endTime`: 结束时间（可选）
- `limit`: 返回日志条数限制（可选）
- `orderBy`: 排序方式 asc/desc（可选）
- `orderType`: 排序字段 timestamp（可选）

### getCloudRunServiceEvent

获取云托管服务事件

**参数：**
- `serviceName`: 服务名称
- `versionName`: 版本名称（可选）
- `startTime`: 开始时间（可选）
- `endTime`: 结束时间（可选）
- `limit`: 返回事件条数限制（可选）

## 使用场景

### 开发流程

1. **创建服务**
   ```
   调用 createCloudRunService 创建云托管服务
   ```

2. **部署代码**
   ```
   调用 createCloudRunVersion 创建服务版本并部署代码
   ```

3. **配置流量**
   ```
   调用 updateCloudRunVersionFlowRatio 配置版本流量分配
   ```

4. **监控运维**
   ```
   调用 getCloudRunServiceLogs 查看服务日志
   调用 getCloudRunServiceEvent 查看服务事件
   ```

### 资源规格

#### CPU 规格
- `0.25`: 0.25 核
- `0.5`: 0.5 核
- `1`: 1 核
- `2`: 2 核
- `4`: 4 核
- `8`: 8 核
- `16`: 16 核

#### 内存规格
- `0.5Gi`: 0.5 GB
- `1Gi`: 1 GB
- `2Gi`: 2 GB
- `4Gi`: 4 GB
- `8Gi`: 8 GB
- `16Gi`: 16 GB
- `32Gi`: 32 GB

### 服务类型

- **web**: 网站类服务，适合 Web 应用、API 服务等
- **worker**: 任务类服务，适合后台任务、定时任务等

### 部署方式

- **package**: 本地代码包上传
- **image**: 容器镜像部署
- **repository**: 代码仓库部署

## 注意事项

- 云托管服务需要在腾讯云开发环境中运行
- 服务创建后需要创建版本才能正常提供服务
- 流量配置的总比例应为 100%
- 建议根据实际业务需求选择合适的资源规格
- 删除服务前建议先删除所有版本

## 常见问题

### Q: 云托管服务和云函数有什么区别？
A: 云托管服务适合长期运行的后端应用，支持多种编程语言和框架；云函数适合事件驱动的短时任务。

### Q: 如何选择合适的资源规格？
A: 根据应用的 CPU 和内存需求选择，建议从较小规格开始，根据监控数据调整。

### Q: 什么是流量配置？
A: 流量配置用于在多个版本之间分配访问流量，支持灰度发布和 A/B 测试。

### Q: 如何查看服务运行状态？
A: 可以通过 getCloudRunServiceDetail 查看服务详情，通过 getCloudRunServiceLogs 查看运行日志。

### Q: 支持哪些部署方式？
A: 支持本地代码包上传、容器镜像部署和代码仓库部署三种方式。

### Q: 如何设置环境变量？
A: 在创建服务或版本时通过 envVariables 参数设置，支持运行时动态配置。

### Q: 云托管服务如何扩缩容？
A: 通过 minReplicas 和 maxReplicas 参数设置自动扩缩容范围，系统会根据负载自动调整实例数量。