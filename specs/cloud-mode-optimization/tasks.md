# 实施计划

## 任务列表

- [x] 1. 创建云端模式检测工具模块
  - 在`mcp/src/utils/`下创建`cloud-mode.ts`
  - 实现`isCloudMode()`和`enableCloudMode()`函数
  - 导出到主模块，供其他组件使用
  - _需求: 需求1, 需求6_

- [x] 2. 修改CLI入口支持云端模式参数
  - 修改`mcp/src/cli.ts`添加`--cloud-mode`参数解析
  - 使用兼容Node.js 18.15的简单命令行解析
  - 当检测到参数时调用`enableCloudMode()`
  - 在日志中明确标识运行模式
  - _需求: 需求1, 需求6_

- [x] 3. 优化认证状态管理避免本地缓存
  - 修改`mcp/src/auth.ts`的`getLoginState()`函数
  - 在云端模式下直接基于环境变量构造认证状态
  - 跳过`loginByApiSecret`调用和本地状态缓存
  - 支持`TENCENTCLOUD_SESSIONTOKEN`临时密钥
  - _需求: 需求2_

- [x] 4. 修改环境ID管理实现配置隔离
  - 修改`mcp/src/cloudbase-manager.ts`的`_fetchEnvId()`方法
  - 优先使用环境变量`CLOUDBASE_ENVID`
  - 跳过`loadEnvIdFromUserConfig`和`saveEnvIdToUserConfig`调用
  - 不写入本地配置文件
  - _需求: 需求3_

- [x] 5. 实现服务器级别的工具过滤机制
  - 修改`mcp/src/server.ts`的插件注册逻辑
  - 定义云端不兼容插件列表（interactive, setup等）
  - 在`parseEnabledPlugins()`中过滤云端不兼容插件
  - 添加云端模式过滤日志记录
  - _需求: 需求4_

- [x] 6. 实现工具级条件注册机制 ⭐
  - 在`mcp/src/utils/cloud-mode.ts`中新增`shouldRegisterTool()`函数
  - 定义云端不兼容工具列表
  - 实现`conditionalRegisterTool()`函数
  - 提供工具级别的精确过滤
  - _需求: 需求5_

- [x] 7. 更新各个工具模块使用条件注册
  - 修改`mcp/src/tools/storage.ts`中的`uploadFile`工具
  - 修改`mcp/src/tools/hosting.ts`中的`uploadFiles`工具
  - 修改`mcp/src/tools/functions.ts`中的`createFunction`和`updateFunctionCode`工具
  - 修改`mcp/src/tools/download.ts`中的`downloadRemoteFile`工具
  - 修改`mcp/src/tools/setup.ts`中的`downloadTemplate`工具
  - 修改`mcp/src/tools/interactive.ts`中的`interactiveDialog`工具
  - _需求: 需求5_

- [x] 8. 更新服务器构造函数支持云端模式配置
  - 修改`createCloudBaseMcpServer()`函数接口
  - 添加`cloudMode?: boolean`配置选项
  - 支持通过构造参数启用云端模式
  - 实现配置优先级策略
  - _需求: 需求6_

- [x] 9. 修改交互工具避免本地文件操作
  - 修改`mcp/src/tools/interactive.ts`相关函数
  - 在云端模式下跳过用户配置文件操作
  - 优化`_promptAndSetEnvironmentId`在云端模式下的行为
  - 避免启动InteractiveServer
  - _需求: 需求3, 需求4_

- [x] 10. 添加工具级别的云端兼容性检查
  - 在需要的工具注册函数中添加云端模式检查
  - 对不兼容的工具直接跳过注册或返回错误
  - 确保tool列表响应中不包含不兼容工具
  - 添加相应的错误提示信息
  - _需求: 需求4, 需求5_

- [x] 11. 创建云端模式单元测试
  - 创建`tests/cloud-mode.test.js`测试文件
  - 测试云端模式检测逻辑
  - 测试认证状态构造逻辑
  - 测试工具过滤机制
  - 测试环境变量依赖
  - _需求: 所有需求的验证_

- [x] 12. 更新文档和类型定义
  - 更新`mcp/src/types.ts`添加云端模式相关类型
  - 更新README.md添加云端模式使用说明
  - 更新工具文档说明云端兼容性
  - 添加云端部署最佳实践文档
  - _需求: 需求6_

- [x] 13. 验证和测试
  - 构建验证确保无类型错误
  - 测试云端模式下的工具过滤效果
  - 验证本地模式的正常使用
  - 测试多租户环境隔离效果
  - _需求: 所有需求的验证_

## 任务优先级

1. **高优先级**: 任务1, 任务2, 任务3, 任务4 - 核心功能实现
2. **中优先级**: 任务5, 任务6, 任务7 - 工具过滤机制
3. **低优先级**: 任务8, 任务9, 任务10 - 配置和优化
4. **验证**: 任务11, 任务12, 任务13 - 测试和文档

## 实施顺序

1. **第一阶段**: 基础架构 (任务1-4)
   - 云端模式检测
   - CLI参数支持
   - 认证缓存优化
   - 环境ID配置隔离

2. **第二阶段**: 工具过滤 (任务5-7)
   - 工具级条件注册机制
   - 各工具模块更新
   - 插件级过滤

3. **第三阶段**: 配置和优化 (任务8-10)
   - 构造函数支持
   - 交互工具优化
   - 兼容性检查

4. **第四阶段**: 验证和文档 (任务11-13)
   - 单元测试
   - 文档更新
   - 集成验证

## 风险控制

1. **向后兼容性**: 确保本地模式不受影响
2. **类型安全**: 修复认证状态结构变化导致的类型错误
3. **性能影响**: 最小化云端模式检测的性能开销
4. **测试覆盖**: 充分测试各种使用场景
