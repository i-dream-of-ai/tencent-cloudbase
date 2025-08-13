# 需求文档

## 介绍

当前MCP在云端作为服务器运行时存在环境隔离问题和工具适用性问题。主要包括：
1. 本地文件缓存导致的跨进程缓存污染，可能串环境
2. 某些工具不适合在云端环境运行（如本地文件操作、交互式登录等）

需要增加云端运行模式，确保多租户环境下的安全隔离和合适的工具过滤。

## 需求

### 需求 1 - 云端运行模式支持
**用户故事：** 作为开发者，我希望能在云端部署MCP服务时，通过启动参数控制运行模式，确保云端和本地模式使用不同的工具集和缓存策略。

#### 验收标准
1. When 启动MCP时传入`--cloud-mode`参数时，the 系统 shall 启用云端运行模式。
2. When 环境变量`CLOUDBASE_MCP_CLOUD_MODE=true`存在时，the 系统 shall 自动启用云端运行模式。
3. When 云端模式启用时，the 系统 shall 在日志中明确标识当前运行模式。

### 需求 2 - 认证缓存隔离优化
**用户故事：** 作为系统管理员，我希望在云端模式下认证状态不会写入本地文件缓存，避免跨用户的缓存污染。

#### 验收标准
1. When 云端模式下有`TENCENTCLOUD_SECRETID`和`TENCENTCLOUD_SECRETKEY`环境变量时，the 系统 shall 直接构造认证状态而不调用`loginByApiSecret`。
2. When 云端模式启用时，the 系统 shall 跳过本地登录状态缓存的读取和写入。
3. When 云端模式下使用临时密钥认证时，the 系统 shall 基于环境变量构造完整的认证信息。

### 需求 3 - 环境ID配置隔离
**用户故事：** 作为开发者，我希望在云端模式下环境ID完全依赖环境变量，不读写本地配置文件。

#### 验收标准
1. When 云端模式启用且`CLOUDBASE_ENVID`环境变量存在时，the 系统 shall 跳过`loadEnvIdFromUserConfig`和`saveEnvIdToUserConfig`操作。
2. When 云端模式下没有环境变量`CLOUDBASE_ENVID`时，the 系统 shall 返回明确的错误信息。
3. When 云端模式启用时，the 系统 shall 不创建或修改用户配置文件。

### 需求 4 - 工具过滤机制
**用户故事：** 作为系统管理员，我希望在云端模式下只暴露适合云端运行的工具，过滤掉本地文件操作和交互相关的工具。

#### 验收标准
1. When 云端模式启用时，the 系统 shall 过滤掉`interactive`插件相关的所有工具。
2. When 云端模式启用时，the 系统 shall 过滤掉涉及本地文件系统操作的工具。
3. When 云端模式启用时，the 系统 shall 过滤掉需要本地服务器启动的工具（如InteractiveServer）。
4. When 云端模式启用时，the 系统 shall 在工具列表响应中只返回云端兼容的工具。

### 需求 5 - 工具级条件注册
**用户故事：** 作为开发者，我希望在云端模式下能够精确控制每个工具的注册，避免暴露涉及本地文件操作的工具。

#### 验收标准
1. When 云端模式启用时，the 系统 shall 提供`shouldRegisterTool()`函数来判断工具是否应该注册。
2. When 云端模式启用时，the 系统 shall 提供`conditionalRegisterTool()`函数来条件性注册工具。
3. When 云端模式下涉及本地文件上传的工具（如uploadFile、uploadFiles）被调用时，the 系统 shall 跳过注册。
4. When 云端模式下涉及本地代码部署的工具（如updateFunctionCode、createFunction）被调用时，the 系统 shall 跳过注册。
5. When 云端模式下涉及本地文件下载的工具（如downloadTemplate、downloadRemoteFile）被调用时，the 系统 shall 跳过注册。

### 需求 6 - 配置参数支持
**用户故事：** 作为运维人员，我希望能通过命令行参数或环境变量灵活控制云端模式的启用。

#### 验收标准
1. When CLI启动时传入`--cloud-mode`参数时，the 系统 shall 设置相应的环境变量标识。
2. When 通过npm包方式集成时提供cloudMode配置选项时，the 系统 shall 根据配置启用对应模式。
3. When 云端模式配置冲突时，the 系统 shall 采用优先级策略（命令行 > 构造参数 > 环境变量）。
