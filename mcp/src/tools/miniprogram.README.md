# 小程序发布 MCP 插件

这是一个用于小程序开发和发布的 MCP 插件，基于 `miniprogram-ci` 实现。

## 功能特性

- **上传小程序代码** - 将小程序代码上传到微信平台
- **预览小程序代码** - 生成预览二维码，便于测试
- **构建 npm 包** - 构建小程序 npm 依赖
- **获取项目配置** - 读取 project.config.json 配置

## 环境变量配置

使用该插件需要配置以下环境变量之一：

```bash
# 方式1: 直接设置私钥内容
export MINIPROGRAM_PRIVATE_KEY="私钥内容"

# 方式2: 设置私钥文件路径
export MINIPROGRAM_PRIVATE_KEY_PATH="/path/to/private.key"
```

## 获取私钥

1. 访问 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入 "管理" -> "开发管理" -> "开发设置"
3. 找到 "小程序代码上传" 部分
4. 生成「代码上传密钥」
5. 配置 IP 白名单（建议开启）
6. 下载私钥文件

## 使用示例

### 上传小程序代码

```json
{
  "tool": "uploadMiniprogramCode",
  "arguments": {
    "projectPath": "/path/to/miniprogram",
    "version": "1.0.0",
    "desc": "第一个版本",
    "appid": "wxabcdefghijklmnop"
  }
}
```

### 预览小程序代码

```json
{
  "tool": "previewMiniprogramCode",
  "arguments": {
    "projectPath": "/path/to/miniprogram",
    "desc": "开发预览",
    "qrcodeFormat": "terminal"
  }
}
```

### 构建 npm 包

```json
{
  "tool": "buildMiniprogramNpm",
  "arguments": {
    "projectPath": "/path/to/miniprogram"
  }
}
```

### 获取项目配置

```json
{
  "tool": "getMiniprogramProjectConfig",
  "arguments": {
    "projectPath": "/path/to/miniprogram"
  }
}
```

## 参数说明

### 通用参数

- `projectPath` - 小程序项目路径
- `appid` - 小程序 AppID（可选，会从 project.config.json 中读取）
- `privateKey` - 私钥内容（可选，优先使用环境变量）
- `privateKeyPath` - 私钥文件路径（可选，优先使用环境变量）
- `robot` - 机器人编号，可选值：1-30（默认为 1）

### 编译设置

- `setting.es6` - 是否使用 ES6 转 ES5（默认：true）
- `setting.es7` - 是否使用 ES7 转 ES5（默认：true）
- `setting.minify` - 是否压缩代码（默认：true）
- `setting.codeProtect` - 是否代码保护（默认：false）
- `setting.autoPrefixWXSS` - 是否自动补全 WXSS（默认：true）

## 注意事项

1. 确保小程序项目路径包含有效的 `project.config.json` 文件
2. 私钥信息非常重要，请妥善保管
3. 建议在生产环境中使用 IP 白名单限制访问
4. 上传操作不可逆，请谨慎操作

## 错误处理

插件会返回详细的错误信息，包括：
- 项目路径不存在
- 私钥配置错误
- 网络连接问题
- 微信平台 API 错误

所有错误都会以 JSON 格式返回，便于调试和处理。