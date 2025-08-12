# 实施计划

## 任务列表

- [ ] 1. 创建云端模式检测工具模块
  - 在`mcp/src/utils/`下创建`cloud-mode.ts`
  - 实现`isCloudMode()`和`enableCloudMode()`函数
  - 导出到主模块，供其他组件使用
  - _需求: 需求1, 需求5_

- [ ] 2. 修改CLI入口支持云端模式参数
  - 修改`mcp/src/cli.ts`添加`--cloud-mode`参数解析
  - 使用`node:util`的`parseArgs`解析命令行参数
  - 当检测到参数时调用`enableCloudMode()`
  - 在日志中明确标识运行模式
  - _需求: 需求1, 需求5_

- [ ] 3. 优化认证状态管理避免本地缓存
  - 修改`mcp/src/auth.ts`的`getLoginState()`函数
  - 在云端模式下直接基于环境变量构造认证状态
  - 跳过`loginByApiSecret`调用和本地状态缓存
  - 支持`TENCENTCLOUD_SESSIONTOKEN`临时密钥
  - _需求: 需求2_

- [ ] 4. 修改环境ID管理实现配置隔离
  - 修改`mcp/src/cloudbase-manager.ts`的`_fetchEnvId()`方法
  - 在云端模式下强制要求`CLOUDBASE_ENVID`环境变量
  - 跳过`loadEnvIdFromUserConfig`和`saveEnvIdToUserConfig`调用
  - 不写入本地配置文件
  - _需求: 需求3_

- [ ] 5. 实现服务器级别的工具过滤机制
  - 修改`mcp/src/server.ts`的插件注册逻辑
  - 定义云端不兼容插件列表（interactive, setup等）
  - 在`parseEnabledPlugins()`中过滤云端不兼容插件
  - 添加云端模式过滤日志记录
  - _需求: 需求4_

- [ ] 6. 更新服务器构造函数支持云端模式配置
  - 修改`createCloudBaseMcpServer()`函数接口
  - 添加`cloudMode?: boolean`配置选项
  - 支持通过构造参数启用云端模式
  - 实现配置优先级策略
  - _需求: 需求5_

- [ ] 7. 修改交互工具避免本地文件操作
  - 修改`mcp/src/tools/interactive.ts`相关函数
  - 在云端模式下跳过用户配置文件操作
  - 优化`_promptAndSetEnvironmentId`在云端模式下的行为
  - 避免启动InteractiveServer
  - _需求: 需求3, 需求4_

- [ ] 8. 添加工具级别的云端兼容性检查
  - 在需要的工具注册函数中添加云端模式检查
  - 对不兼容的工具直接跳过注册或返回错误
  - 确保tool列表响应中不包含不兼容工具
  - 添加相应的错误提示信息
  - _需求: 需求4_

- [ ] 9. 创建云端模式单元测试
  - 创建`tests/cloud-mode.test.js`测试文件
  - 测试云端模式检测逻辑
  - 测试认证状态构造逻辑
  - 测试工具过滤机制
  - 测试环境变量依赖
  - _需求: 所有需求的验证_

- [ ] 10. 更新文档和类型定义
  - 更新`mcp/src/types.ts`添加云端模式相关类型
  - 更新README.md添加云端模式使用说明
  - 更新工具文档说明云端兼容性
  - 添加云端部署最佳实践文档
  - _需求: 需求5_
