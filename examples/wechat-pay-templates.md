# WeChat Pay 云函数模板

## 支付回调处理函数

### 功能说明
处理微信支付回调通知，验证签名并更新订单状态。

### 环境变量配置
```
WECHAT_PAY_APPID=你的小程序或公众号AppID
WECHAT_PAY_MCHID=你的商户号
WECHAT_PAY_PRIVATE_KEY=商户私钥
WECHAT_PAY_SERIAL_NO=商户证书序列号
WECHAT_PAY_APIV3_KEY=APIv3密钥
```

### 函数代码
```javascript
const cloud = require('wx-server-sdk');
const WechatPay = require('wechatpay-node-v3');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 微信支付配置
const pay = new WechatPay({
  appid: process.env.WECHAT_PAY_APPID,
  mchid: process.env.WECHAT_PAY_MCHID,
  private_key: process.env.WECHAT_PAY_PRIVATE_KEY,
  serial_no: process.env.WECHAT_PAY_SERIAL_NO,
  apiv3_private_key: process.env.WECHAT_PAY_APIV3_KEY
});

exports.main = async (event, context) => {
  try {
    // 验证签名
    const isValid = pay.verifySign({
      signature: event.headers['wechatpay-signature'],
      timestamp: event.headers['wechatpay-timestamp'],
      nonce: event.headers['wechatpay-nonce'],
      body: event.body
    });

    if (!isValid) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: '签名验证失败' })
      };
    }

    // 解密回调数据
    const decryptedData = pay.decrypt({
      ciphertext: event.body.resource.ciphertext,
      associated_data: event.body.resource.associated_data,
      nonce: event.body.resource.nonce
    });

    // 更新订单状态
    if (decryptedData.trade_state === 'SUCCESS') {
      await db.collection('orders').doc(decryptedData.out_trade_no).update({
        data: {
          status: 'paid',
          transaction_id: decryptedData.transaction_id,
          paid_time: new Date(decryptedData.success_time),
          updated_at: new Date()
        }
      });
    }

    // 返回成功响应
    return {
      statusCode: 200,
      body: JSON.stringify({ code: 'SUCCESS', message: '成功' })
    };

  } catch (error) {
    console.error('支付回调处理错误:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '处理失败' })
    };
  }
};
```

### package.json
```json
{
  "name": "wechat-pay-notify",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "latest",
    "wechatpay-node-v3": "^2.1.7"
  }
}
```

## 创建支付订单函数

### 功能说明
创建微信支付订单，支持JSAPI、Native、H5、APP等支付方式。

### 函数代码
```javascript
const cloud = require('wx-server-sdk');
const WechatPay = require('wechatpay-node-v3');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 微信支付配置
const pay = new WechatPay({
  appid: process.env.WECHAT_PAY_APPID,
  mchid: process.env.WECHAT_PAY_MCHID,
  private_key: process.env.WECHAT_PAY_PRIVATE_KEY,
  serial_no: process.env.WECHAT_PAY_SERIAL_NO,
  apiv3_private_key: process.env.WECHAT_PAY_APIV3_KEY,
  notify_url: 'https://your-domain.com/api/wechat-pay/notify'
});

exports.main = async (event, context) => {
  try {
    const { 
      payment_type = 'jsapi', // jsapi, native, h5, app
      description,
      amount,
      openid,
      out_trade_no,
      attach
    } = event;

    // 生成订单号（如果没有提供）
    const orderNo = out_trade_no || `ORDER_${Date.now()}`;

    // 构建支付参数
    const paymentParams = {
      appid: process.env.WECHAT_PAY_APPID,
      mchid: process.env.WECHAT_PAY_MCHID,
      description,
      out_trade_no: orderNo,
      amount: {
        total: amount,
        currency: 'CNY'
      },
      attach,
      notify_url: pay.notify_url
    };

    // 根据支付类型添加特定参数
    if (payment_type === 'jsapi') {
      paymentParams.payer = { openid };
    } else if (payment_type === 'h5') {
      paymentParams.scene_info = {
        payer_client_ip: event.client_ip || '127.0.0.1',
        h5_info: {
          type: 'Wap'
        }
      };
    }

    // 创建支付订单
    let result;
    switch (payment_type) {
      case 'jsapi':
        result = await pay.transactions_jsapi(paymentParams);
        break;
      case 'native':
        result = await pay.transactions_native(paymentParams);
        break;
      case 'h5':
        result = await pay.transactions_h5(paymentParams);
        break;
      case 'app':
        result = await pay.transactions_app(paymentParams);
        break;
      default:
        throw new Error('不支持的支付类型');
    }

    // 保存订单信息
    await db.collection('orders').add({
      data: {
        order_no: orderNo,
        description,
        amount,
        payment_type,
        openid,
        attach,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    return {
      success: true,
      data: result,
      order_no: orderNo
    };

  } catch (error) {
    console.error('创建支付订单错误:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
```

## 查询支付订单函数

### 功能说明
查询微信支付订单状态。

### 函数代码
```javascript
const cloud = require('wx-server-sdk');
const WechatPay = require('wechatpay-node-v3');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 微信支付配置
const pay = new WechatPay({
  appid: process.env.WECHAT_PAY_APPID,
  mchid: process.env.WECHAT_PAY_MCHID,
  private_key: process.env.WECHAT_PAY_PRIVATE_KEY,
  serial_no: process.env.WECHAT_PAY_SERIAL_NO,
  apiv3_private_key: process.env.WECHAT_PAY_APIV3_KEY
});

exports.main = async (event, context) => {
  try {
    const { out_trade_no, transaction_id } = event;

    if (!out_trade_no && !transaction_id) {
      return {
        success: false,
        error: '订单号或微信订单号必须提供其中一个'
      };
    }

    // 查询微信支付订单
    const result = await pay.query({
      out_trade_no,
      transaction_id,
      mchid: process.env.WECHAT_PAY_MCHID
    });

    // 如果订单已支付，更新本地数据库状态
    if (result.trade_state === 'SUCCESS') {
      await db.collection('orders').where({
        order_no: out_trade_no
      }).update({
        data: {
          status: 'paid',
          transaction_id: result.transaction_id,
          paid_time: new Date(result.success_time),
          updated_at: new Date()
        }
      });
    }

    return {
      success: true,
      data: result
    };

  } catch (error) {
    console.error('查询支付订单错误:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
```

## 创建退款函数

### 功能说明
创建微信支付退款订单。

### 函数代码
```javascript
const cloud = require('wx-server-sdk');
const WechatPay = require('wechatpay-node-v3');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 微信支付配置
const pay = new WechatPay({
  appid: process.env.WECHAT_PAY_APPID,
  mchid: process.env.WECHAT_PAY_MCHID,
  private_key: process.env.WECHAT_PAY_PRIVATE_KEY,
  serial_no: process.env.WECHAT_PAY_SERIAL_NO,
  apiv3_private_key: process.env.WECHAT_PAY_APIV3_KEY
});

exports.main = async (event, context) => {
  try {
    const {
      out_trade_no,
      transaction_id,
      out_refund_no,
      refund_amount,
      total_amount,
      reason
    } = event;

    if (!out_trade_no && !transaction_id) {
      return {
        success: false,
        error: '订单号或微信订单号必须提供其中一个'
      };
    }

    // 生成退款订单号（如果没有提供）
    const refundNo = out_refund_no || `REFUND_${Date.now()}`;

    // 创建退款
    const result = await pay.refund({
      out_trade_no,
      transaction_id,
      out_refund_no: refundNo,
      reason,
      amount: {
        refund: refund_amount,
        total: total_amount,
        currency: 'CNY'
      }
    });

    // 保存退款信息
    await db.collection('refunds').add({
      data: {
        refund_no: refundNo,
        out_trade_no,
        transaction_id,
        refund_amount,
        total_amount,
        reason,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    return {
      success: true,
      data: result,
      refund_no: refundNo
    };

  } catch (error) {
    console.error('创建退款错误:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
```

## 使用说明

1. **环境配置**：在云开发控制台中配置环境变量，包括微信支付的各项配置参数。

2. **数据库设计**：
   - `orders` 集合：存储订单信息
   - `refunds` 集合：存储退款信息

3. **部署流程**：
   - 使用 CloudBase AI Toolkit 的 `createFunction` 工具创建云函数
   - 配置环境变量
   - 部署函数代码

4. **小程序端调用**：
   ```javascript
   // 创建支付订单
   wx.cloud.callFunction({
     name: 'createPayment',
     data: {
       payment_type: 'jsapi',
       description: '商品描述',
       amount: 100, // 金额（分）
       openid: 'user_openid'
     }
   }).then(res => {
     // 调起支付
     wx.requestPayment({
       timeStamp: String(Date.now()),
       nonceStr: 'random_string',
       package: `prepay_id=${res.result.data.prepay_id}`,
       signType: 'RSA',
       paySign: 'generated_sign',
       success: function(res) {
         console.log('支付成功', res);
       },
       fail: function(res) {
         console.log('支付失败', res);
       }
     });
   });
   ```

5. **安全建议**：
   - 商户私钥等敏感信息必须通过环境变量配置
   - 回调URL必须使用HTTPS
   - 做好签名验证和数据解密
   - 添加重复通知处理逻辑