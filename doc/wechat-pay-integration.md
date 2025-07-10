# WeChat Pay 集成指南

## 概述

CloudBase AI Toolkit 现已支持微信支付集成，通过 MCP (Model Context Protocol) 工具让 AI 助手能够帮助你快速集成微信支付功能。

## 功能特性

### 🚀 支持的支付方式
- **JSAPI支付**: 小程序、公众号内支付
- **Native支付**: 扫码支付
- **H5支付**: 手机网站支付
- **APP支付**: 移动应用支付

### 🔧 核心功能
- **订单管理**: 创建、查询、关闭支付订单
- **退款管理**: 创建、查询退款订单
- **回调处理**: 验证签名、解密数据
- **安全保障**: 证书管理、签名验证

## 快速开始

### 1. 环境配置

在使用微信支付功能之前，需要配置相关环境变量：

```bash
# 微信支付配置
export WECHAT_PAY_APPID="你的小程序/公众号AppID"
export WECHAT_PAY_MCHID="你的商户号"
export WECHAT_PAY_PRIVATE_KEY="商户私钥"
export WECHAT_PAY_SERIAL_NO="商户证书序列号"
export WECHAT_PAY_APIV3_KEY="APIv3密钥"
export WECHAT_PAY_NOTIFY_URL="回调通知URL"
export WECHAT_PAY_SANDBOX="false"  # 是否使用沙箱环境
```

### 2. 启用微信支付插件

确保在 CloudBase MCP 服务器中启用了微信支付插件：

```bash
# 方法1：通过环境变量启用
export CLOUDBASE_MCP_PLUGINS_ENABLED="env,database,functions,hosting,storage,wechat-pay"

# 方法2：默认情况下已包含微信支付插件
```

### 3. 安装依赖

```bash
npm install wechatpay-node-v3
```

## MCP 工具使用指南

### 创建 JSAPI 支付订单

```javascript
// AI 助手可以帮你生成这样的调用
const result = await mcpServer.callTool('createJsapiPayment', {
  appid: process.env.WECHAT_PAY_APPID,
  mchid: process.env.WECHAT_PAY_MCHID,
  description: '商品购买',
  out_trade_no: 'ORDER_' + Date.now(),
  amount: {
    total: 100, // 1元 = 100分
    currency: 'CNY'
  },
  payer: {
    openid: 'user_openid_here'
  },
  scene_info: {
    payer_client_ip: '127.0.0.1'
  }
});
```

### 创建 Native 支付订单

```javascript
const result = await mcpServer.callTool('createNativePayment', {
  appid: process.env.WECHAT_PAY_APPID,
  mchid: process.env.WECHAT_PAY_MCHID,
  description: '商品购买',
  out_trade_no: 'ORDER_' + Date.now(),
  amount: {
    total: 100,
    currency: 'CNY'
  },
  scene_info: {
    payer_client_ip: '127.0.0.1'
  }
});
// 返回的 result.code_url 可用于生成支付二维码
```

### 查询支付订单

```javascript
const result = await mcpServer.callTool('queryPayment', {
  out_trade_no: 'ORDER_123456789',
  mchid: process.env.WECHAT_PAY_MCHID
});
```

### 创建退款

```javascript
const result = await mcpServer.callTool('createRefund', {
  out_trade_no: 'ORDER_123456789',
  out_refund_no: 'REFUND_' + Date.now(),
  reason: '用户申请退款',
  amount: {
    refund: 50,  // 退款金额
    total: 100,  // 原订单金额
    currency: 'CNY'
  }
});
```

### 验证回调签名

```javascript
const result = await mcpServer.callTool('verifyWebhookSignature', {
  signature: req.headers['wechatpay-signature'],
  timestamp: req.headers['wechatpay-timestamp'],
  nonce: req.headers['wechatpay-nonce'],
  body: JSON.stringify(req.body)
});
```

## 云函数模板

### 支付回调处理函数

```javascript
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  try {
    // 使用 AI 助手生成的回调处理代码
    const result = await mcpServer.callTool('verifyWebhookSignature', {
      signature: event.headers['wechatpay-signature'],
      timestamp: event.headers['wechatpay-timestamp'],
      nonce: event.headers['wechatpay-nonce'],
      body: event.body
    });

    if (result.isValid) {
      // 解密数据
      const decryptedData = await mcpServer.callTool('decryptWebhookData', {
        ciphertext: event.body.resource.ciphertext,
        associated_data: event.body.resource.associated_data,
        nonce: event.body.resource.nonce
      });

      // 更新订单状态
      // ... 业务逻辑
      
      return { code: 'SUCCESS', message: '成功' };
    } else {
      return { code: 'FAIL', message: '签名验证失败' };
    }
  } catch (error) {
    console.error('回调处理错误:', error);
    return { code: 'FAIL', message: '处理失败' };
  }
};
```

## 最佳实践

### 1. 安全配置
- 敏感信息（私钥、密钥等）必须通过环境变量配置
- 回调URL必须使用HTTPS
- 严格验证回调签名

### 2. 错误处理
- 网络异常处理
- 支付失败重试逻辑
- 订单状态同步

### 3. 数据库设计
```sql
-- 订单表
CREATE TABLE orders (
  id VARCHAR(64) PRIMARY KEY,
  out_trade_no VARCHAR(64) UNIQUE,
  transaction_id VARCHAR(64),
  description TEXT,
  amount INT,
  status VARCHAR(20),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- 退款表
CREATE TABLE refunds (
  id VARCHAR(64) PRIMARY KEY,
  out_refund_no VARCHAR(64) UNIQUE,
  out_trade_no VARCHAR(64),
  refund_amount INT,
  status VARCHAR(20),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 4. 小程序端集成
```javascript
// 小程序支付调用
wx.cloud.callFunction({
  name: 'createPayment',
  data: {
    description: '商品描述',
    amount: 100,
    openid: wx.getStorageSync('openid')
  }
}).then(res => {
  if (res.result.success) {
    // 调起支付
    wx.requestPayment({
      timeStamp: String(Date.now()),
      nonceStr: 'random_string',
      package: `prepay_id=${res.result.data.prepay_id}`,
      signType: 'RSA',
      paySign: 'generated_sign',
      success: function(res) {
        console.log('支付成功');
      },
      fail: function(res) {
        console.log('支付失败');
      }
    });
  }
});
```

## 常见问题

### Q1: 如何获取微信支付配置参数？
A1: 
- AppID：小程序后台 -> 设置 -> 基本设置
- 商户号：微信支付商户平台 -> 账户中心
- 私钥：微信支付商户平台 -> API安全 -> 下载证书
- APIv3密钥：微信支付商户平台 -> API安全 -> 设置APIv3密钥

### Q2: 签名验证失败怎么办？
A2: 检查以下项目：
- 证书序列号是否正确
- 私钥格式是否正确
- 时间戳是否在有效期内
- 请求体是否完整

### Q3: 回调URL配置
A3: 
- 必须使用HTTPS
- 域名必须备案
- 返回格式必须为JSON
- 成功时返回：`{"code": "SUCCESS", "message": "成功"}`

### Q4: 沙箱环境测试
A4: 设置环境变量 `WECHAT_PAY_SANDBOX=true` 启用沙箱环境进行测试。

## 相关资源

- [微信支付官方文档](https://pay.weixin.qq.com/wiki/doc/apiv3/index.shtml)
- [wechatpay-node-v3 GitHub](https://github.com/klover2/wechatpay-node-v3)
- [CloudBase AI Toolkit 文档](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit)

## 技术支持

如有问题，请在 GitHub 仓库提交 Issue：
https://github.com/TencentCloudBase/CloudBase-AI-ToolKit/issues