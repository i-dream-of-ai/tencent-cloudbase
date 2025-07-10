# 小程序 MCP 插件

小程序 MCP 插件提供微信小程序开发和发布的核心功能。

## 功能特性

- **代码上传**: 将小程序代码上传到微信平台
- **代码预览**: 生成预览二维码，支持多种格式
- **npm 构建**: 构建小程序 npm 包
- **配置读取**: 读取小程序项目配置信息

## 环境变量配置

使用此插件需要配置以下环境变量之一：

```bash
# 方式一：直接设置私钥内容
export MINIPROGRAM_PRIVATE_KEY="私钥内容"

# 方式二：设置私钥文件路径
export MINIPROGRAM_PRIVATE_KEY_PATH="/path/to/private.key"
```

## 启用插件

小程序插件不在默认插件列表中，需要显式启用：

```bash
export CLOUDBASE_MCP_PLUGINS_ENABLED="env,database,functions,hosting,storage,setup,interactive,rag,gateway,download,miniprogram"
```

## 可用工具

### uploadMiniprogramCode
上传小程序代码到微信平台

**参数：**
- `appId`: 小程序 AppId
- `projectPath`: 小程序项目路径
- `version`: 版本号
- `desc`: 版本描述（可选）
- `setting`: 项目配置（可选）
- `robot`: 机器人编号，默认为1（可选）

### previewMiniprogramCode
预览小程序代码，生成二维码

**参数：**
- `appId`: 小程序 AppId
- `projectPath`: 小程序项目路径
- `desc`: 预览描述（可选）
- `setting`: 项目配置（可选）
- `qrcodeFormat`: 二维码格式，可选值：terminal、base64、image（可选）
- `qrcodeOutputDest`: 二维码输出路径（可选）
- `robot`: 机器人编号，默认为1（可选）

### buildMiniprogramNpm
构建小程序 npm 包

**参数：**
- `appId`: 小程序 AppId
- `projectPath`: 小程序项目路径
- `robot`: 机器人编号，默认为1（可选）

### getMiniprogramProjectConfig
获取小程序项目配置信息

**参数：**
- `projectPath`: 小程序项目路径

## 密钥和IP白名单配置

使用前需要在微信公众平台进行以下配置：

1. 访问 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入"管理-开发管理-开发设置-小程序代码上传"
3. 生成"代码上传密钥"
4. 配置IP白名单（建议开启）

## 使用示例

```bash
# 上传代码
{
  "appId": "your-app-id",
  "projectPath": "/path/to/miniprogram",
  "version": "1.0.0",
  "desc": "首次发布"
}

# 预览代码
{
  "appId": "your-app-id", 
  "projectPath": "/path/to/miniprogram",
  "desc": "开发预览",
  "qrcodeFormat": "terminal"
}
```