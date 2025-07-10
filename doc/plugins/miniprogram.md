# 小程序插件

CloudBase AI Toolkit 支持微信小程序 MCP 插件，提供小程序代码上传、预览、构建等核心功能。

## 插件概览

小程序插件基于 [miniprogram-ci](https://www.npmjs.com/package/miniprogram-ci) 实现，提供与微信开发者工具类似的命令行功能。

### 主要功能

- **代码上传** - 上传小程序代码到微信平台
- **预览生成** - 生成预览二维码进行测试
- **NPM 构建** - 构建小程序 npm 包
- **配置查询** - 读取项目配置信息

## 配置要求

### 环境变量配置

使用小程序插件前，需要配置代码上传密钥：

```bash
# 方式一：直接设置私钥内容
export MINIPROGRAM_PRIVATE_KEY="私钥内容"

# 方式二：设置私钥文件路径
export MINIPROGRAM_PRIVATE_KEY_PATH="/path/to/private.key"
```

### 获取代码上传密钥

1. 访问 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入 **管理 > 开发管理 > 开发设置**
3. 找到 **小程序代码上传** 部分
4. 点击生成「代码上传密钥」
5. 配置 IP 白名单（推荐开启）

⚠️ **安全提醒**：代码上传密钥拥有预览、上传代码的权限，请妥善保管。

## MCP 配置

### 启用小程序插件

在 `.mcp.json` 中启用小程序插件：

```json
{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["-y", "@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "MINIPROGRAM_PRIVATE_KEY": "你的私钥内容",
        "CLOUDBASE_MCP_PLUGINS_ENABLED": "env,database,functions,hosting,storage,setup,interactive,rag,gateway,download,miniprogram"
      }
    }
  }
}
```

### 插件配置说明

- **插件名称**: `miniprogram`
- **默认启用**: ❌ 需要显式启用
- **依赖**: miniprogram-ci ^1.15.0
- **配置方式**: 仅支持环境变量

## 使用方式

### 基本使用流程

1. **配置环境变量**
   ```bash
   export MINIPROGRAM_PRIVATE_KEY="你的私钥内容"
   ```

2. **启用插件**
   ```bash
   export CLOUDBASE_MCP_PLUGINS_ENABLED="env,database,functions,hosting,storage,setup,interactive,rag,gateway,download,miniprogram"
   ```

3. **AI 对话使用**
   ```
   上传小程序代码到微信平台
   预览小程序代码
   构建小程序 npm 包
   ```

### 典型使用场景

```
# 上传代码
请帮我上传小程序代码，项目路径是 ./miniprogram，版本号是 1.0.0

# 预览代码
生成小程序预览二维码，项目在 ./miniprogram 目录

# 构建 npm
为小程序项目构建 npm 包，项目路径是 ./miniprogram

# 查看配置
查看小程序项目配置信息
```

## 工具详情

### uploadMiniprogramCode
- **功能**: 上传小程序代码到微信平台
- **参数**: 
  - `projectPath` (必需): 小程序项目路径
  - `appid` (可选): 小程序 appid
  - `version` (可选): 版本号
  - `desc` (可选): 版本描述
  - `robot` (可选): 机器人编号

### previewMiniprogramCode
- **功能**: 预览小程序代码并生成二维码
- **参数**: 
  - `projectPath` (必需): 小程序项目路径
  - `appid` (可选): 小程序 appid
  - `qrcodeFormat` (可选): 二维码格式
  - `pagePath` (可选): 预览页面路径
  - `robot` (可选): 机器人编号

### buildMiniprogramNpm
- **功能**: 构建小程序 npm 包
- **参数**: 
  - `projectPath` (必需): 小程序项目路径
  - `appid` (可选): 小程序 appid
  - `robot` (可选): 机器人编号

### getMiniprogramProjectConfig
- **功能**: 获取小程序项目配置信息
- **参数**: 
  - `projectPath` (必需): 小程序项目路径

## 注意事项

1. **私钥安全**: 请妥善保管代码上传密钥，不要提交到版本控制系统
2. **IP 白名单**: 建议开启 IP 白名单限制，提高安全性
3. **项目结构**: 确保项目目录包含 `project.config.json` 文件
4. **网络环境**: 上传和预览需要访问微信服务器，确保网络畅通

## 常见问题

**Q: 提示 "miniprogram-ci 依赖未安装" 怎么办？**
A: 这是正常现象，插件会自动处理依赖安装。如果问题持续，请检查网络连接。

**Q: 上传失败提示私钥错误？**
A: 请检查：
1. 私钥内容是否正确
2. 私钥文件路径是否存在
3. 环境变量是否正确设置

**Q: 预览二维码无法显示？**
A: 确保：
1. 项目路径正确
2. project.config.json 文件存在
3. appid 配置正确

## 相关链接

- [微信小程序 CI 文档](https://developers.weixin.qq.com/miniprogram/dev/devtools/ci.html)
- [miniprogram-ci NPM 包](https://www.npmjs.com/package/miniprogram-ci)
- [CloudBase AI Toolkit 文档](../index.md)