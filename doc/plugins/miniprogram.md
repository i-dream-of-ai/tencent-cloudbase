# 小程序 MCP 插件

小程序 MCP 插件提供了 WeChat 小程序的 CI/CD 功能，支持代码上传、预览、构建等核心操作。

## 功能特性

- **代码上传** - 上传小程序代码到微信平台
- **预览生成** - 生成预览二维码用于测试
- **npm 构建** - 构建小程序 npm 包依赖
- **项目配置** - 获取小程序项目配置信息

## 配置要求

### 1. 环境变量配置

```bash
# 设置私钥内容（二选一）
export MINIPROGRAM_PRIVATE_KEY="私钥内容"

# 或者设置私钥文件路径
export MINIPROGRAM_PRIVATE_KEY_PATH="/path/to/private.key"

# 启用小程序插件
export CLOUDBASE_MCP_PLUGINS_ENABLED="env,database,functions,hosting,storage,setup,interactive,rag,gateway,download,miniprogram"
```

### 2. 微信平台配置

1. 访问 [微信公众平台](https://mp.weixin.qq.com/) - 管理 - 开发管理 - 开发设置
2. 在"小程序代码上传"部分生成「代码上传密钥」
3. 配置 IP 白名单（建议开启以提高安全性）

## 工具说明

### uploadMiniprogramCode

上传小程序代码到微信平台。

**参数：**
- `appid` - 小程序的 AppID
- `projectPath` - 项目路径
- `version` - 版本号
- `desc` - 上传描述
- `robot` - 机器人编号 (1-30)，可选
- `setting` - 构建设置，可选

### previewMiniprogramCode

预览小程序代码并生成二维码。

**参数：**
- `appid` - 小程序的 AppID
- `projectPath` - 项目路径
- `desc` - 预览描述
- `robot` - 机器人编号 (1-30)，可选
- `qrcodeFormat` - 二维码格式：'image' | 'base64' | 'terminal'
- `qrcodeOutputDest` - 二维码输出路径，可选

### buildMiniprogramNpm

构建小程序 npm 包。

**参数：**
- `appid` - 小程序的 AppID
- `projectPath` - 项目路径
- `ignoreDevDependencies` - 是否忽略开发依赖，默认 true
- `ignoreUploadUnusedFiles` - 是否忽略未使用文件，默认 true

### getMiniprogramProjectConfig

获取小程序项目配置信息。

**参数：**
- `projectPath` - 项目路径

## 使用示例

```bash
# 上传小程序代码
mcp-tool uploadMiniprogramCode \
  --appid wx1234567890abcdef \
  --projectPath ./dist \
  --version 1.0.0 \
  --desc "自动化部署"

# 生成预览二维码
mcp-tool previewMiniprogramCode \
  --appid wx1234567890abcdef \
  --projectPath ./dist \
  --desc "测试版本"

# 构建 npm 包
mcp-tool buildMiniprogramNpm \
  --appid wx1234567890abcdef \
  --projectPath ./dist
```

## 注意事项

1. 使用前需要先安装 `miniprogram-ci` 依赖
2. 确保项目路径包含有效的小程序项目结构
3. 代码上传密钥需要妥善保管，建议使用环境变量
4. 机器人编号用于区分不同的上传来源，范围 1-30