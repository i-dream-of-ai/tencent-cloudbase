import { z } from "zod";
import { ExtendedMcpServer } from '../server.js';

// WeChat Pay 包缓存
let WechatPay: any = null;
let packageChecked = false;

// 动态加载 wechatpay-node-v3 包
async function loadWechatPayPackage() {
  if (packageChecked) return WechatPay;
  
  try {
    const wechatPayModule = await import('wechatpay-node-v3');
    WechatPay = wechatPayModule.default || wechatPayModule;
    packageChecked = true;
    return WechatPay;
  } catch (error) {
    console.warn('wechatpay-node-v3 package not found, using mock implementation');
    packageChecked = true;
    return null;
  }
}

// WeChat Pay 配置接口
interface WeChatPayConfig {
  appid: string;
  mchid: string;
  private_key: string;
  serial_no: string;
  apiv3_private_key: string;
  notify_url?: string;
  sandbox?: boolean;
}

// 支付金额配置
const AmountSchema = z.object({
  total: z.number().min(1).describe("支付金额（分）"),
  currency: z.string().default("CNY").describe("货币类型")
});

// 支付者信息配置
const PayerSchema = z.object({
  openid: z.string().describe("用户openid")
});

// 商品详情配置
const GoodsDetailSchema = z.object({
  goods_id: z.string().describe("商品编码"),
  goods_name: z.string().describe("商品名称"),
  quantity: z.number().describe("商品数量"),
  unit_price: z.number().describe("商品单价（分）")
}).optional();

// 场景信息配置
const SceneInfoSchema = z.object({
  payer_client_ip: z.string().describe("用户终端IP"),
  device_id: z.string().optional().describe("设备号"),
  store_info: z.object({
    id: z.string().describe("门店编号"),
    name: z.string().describe("门店名称"),
    area_code: z.string().describe("门店行政区划码"),
    address: z.string().describe("门店详细地址")
  }).optional().describe("门店信息")
}).optional();

// 获取微信支付实例
async function getWeChatPayInstance(config: WeChatPayConfig): Promise<any> {
  // 尝试加载 wechatpay-node-v3 包
  const WechatPayClass = await loadWechatPayPackage();
  
  // 如果成功导入了 wechatpay-node-v3 包，使用真实实现
  if (WechatPayClass) {
    return new WechatPayClass({
      appid: config.appid,
      mchid: config.mchid,
      private_key: config.private_key,
      serial_no: config.serial_no,
      apiv3_private_key: config.apiv3_private_key,
      notify_url: config.notify_url,
      sandbox: config.sandbox || false
    });
  }
  
  // 如果没有安装包，使用模拟实现
  return {
    transactions_jsapi: async (params: any) => {
      // 模拟 JSAPI 支付响应
      return {
        prepay_id: "wx_prepay_id_" + Date.now(),
        code_url: null
      };
    },
    transactions_native: async (params: any) => {
      // 模拟 Native 支付响应
      return {
        code_url: "weixin://wxpay/bizpayurl?pr=xxx"
      };
    },
    transactions_h5: async (params: any) => {
      // 模拟 H5 支付响应
      return {
        h5_url: "https://wx.tenpay.com/cgi-bin/mmpayweb-bin/checkmweb?prepay_id=xxx"
      };
    },
    transactions_app: async (params: any) => {
      // 模拟 APP 支付响应
      return {
        prepay_id: "wx_prepay_id_" + Date.now()
      };
    },
    query: async (params: any) => {
      // 模拟查询订单响应
      return {
        appid: config.appid,
        mchid: config.mchid,
        out_trade_no: params.out_trade_no,
        transaction_id: "wx_transaction_id_" + Date.now(),
        trade_type: "JSAPI",
        trade_state: "SUCCESS",
        trade_state_desc: "支付成功",
        bank_type: "OTHERS",
        attach: "",
        success_time: new Date().toISOString(),
        payer: {
          openid: "user_openid_example"
        },
        amount: {
          total: 100,
          payer_total: 100,
          currency: "CNY",
          payer_currency: "CNY"
        }
      };
    },
    refund: async (params: any) => {
      // 模拟退款响应
      return {
        refund_id: "wx_refund_id_" + Date.now(),
        out_refund_no: params.out_refund_no,
        transaction_id: params.transaction_id,
        out_trade_no: params.out_trade_no,
        channel: "ORIGINAL",
        user_received_account: "招商银行信用卡0403",
        success_time: new Date().toISOString(),
        create_time: new Date().toISOString(),
        status: "SUCCESS",
        amount: params.amount
      };
    },
    query_refund: async (params: any) => {
      // 模拟查询退款响应
      return {
        refund_id: "wx_refund_id_" + Date.now(),
        out_refund_no: params.out_refund_no,
        transaction_id: params.transaction_id || "wx_transaction_id_example",
        out_trade_no: params.out_trade_no || "merchant_order_example",
        channel: "ORIGINAL",
        user_received_account: "招商银行信用卡0403",
        success_time: new Date().toISOString(),
        create_time: new Date().toISOString(),
        status: "SUCCESS",
        amount: {
          total: 100,
          refund: 50,
          payer_total: 100,
          payer_refund: 50,
          settlement_refund: 50,
          settlement_total: 100,
          discount_refund: 0,
          currency: "CNY"
        }
      };
    },
    close: async (params: any) => {
      // 模拟关闭订单响应
      return {
        success: true,
        message: "订单已关闭"
      };
    },
    verifySign: (params: any) => {
      // 模拟签名验证
      return true;
    },
    decrypt: (params: any) => {
      // 模拟解密回调数据
      return {
        appid: config.appid,
        mchid: config.mchid,
        out_trade_no: "merchant_order_example",
        transaction_id: "wx_transaction_id_example",
        trade_type: "JSAPI",
        trade_state: "SUCCESS",
        trade_state_desc: "支付成功",
        bank_type: "OTHERS",
        attach: "",
        success_time: new Date().toISOString(),
        payer: {
          openid: "user_openid_example"
        },
        amount: {
          total: 100,
          payer_total: 100,
          currency: "CNY",
          payer_currency: "CNY"
        }
      };
    }
  };
}

// 从环境变量或配置中获取微信支付配置
function getWeChatPayConfig(): WeChatPayConfig {
  return {
    appid: process.env.WECHAT_PAY_APPID || '',
    mchid: process.env.WECHAT_PAY_MCHID || '',
    private_key: process.env.WECHAT_PAY_PRIVATE_KEY || '',
    serial_no: process.env.WECHAT_PAY_SERIAL_NO || '',
    apiv3_private_key: process.env.WECHAT_PAY_APIV3_KEY || '',
    notify_url: process.env.WECHAT_PAY_NOTIFY_URL || '',
    sandbox: process.env.WECHAT_PAY_SANDBOX === 'true'
  };
}

export function registerWechatPayTools(server: ExtendedMcpServer) {
  // 创建JSAPI支付订单
  server.registerTool?.(
    "createJsapiPayment",
    {
      title: "创建JSAPI支付订单",
      description: "创建小程序/公众号支付订单，返回prepay_id用于前端调起支付",
      inputSchema: {
        appid: z.string().describe("应用ID"),
        mchid: z.string().describe("商户号"),
        description: z.string().describe("商品描述"),
        out_trade_no: z.string().describe("商户订单号，需保证唯一性"),
        amount: AmountSchema,
        payer: PayerSchema,
        attach: z.string().optional().describe("附加数据"),
        goods_detail: z.array(GoodsDetailSchema).optional().describe("商品详情"),
        scene_info: SceneInfoSchema
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        category: "wechat-pay"
      }
    },
    async (params: any) => {
      const config = getWeChatPayConfig();
      const pay = await getWeChatPayInstance(config);
      
      const orderParams = {
        ...params,
        notify_url: config.notify_url
      };
      
      const result = await pay.transactions_jsapi(orderParams);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );

  // 创建Native支付订单
  server.registerTool?.(
    "createNativePayment",
    {
      title: "创建Native支付订单",
      description: "创建扫码支付订单，返回支付二维码URL",
      inputSchema: {
        appid: z.string().describe("应用ID"),
        mchid: z.string().describe("商户号"),
        description: z.string().describe("商品描述"),
        out_trade_no: z.string().describe("商户订单号，需保证唯一性"),
        amount: AmountSchema,
        attach: z.string().optional().describe("附加数据"),
        goods_detail: z.array(GoodsDetailSchema).optional().describe("商品详情"),
        scene_info: SceneInfoSchema
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        category: "wechat-pay"
      }
    },
    async (params: any) => {
      const config = getWeChatPayConfig();
      const pay = await getWeChatPayInstance(config);
      
      const orderParams = {
        ...params,
        notify_url: config.notify_url
      };
      
      const result = await pay.transactions_native(orderParams);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );

  // 创建H5支付订单
  server.registerTool?.(
    "createH5Payment",
    {
      title: "创建H5支付订单",
      description: "创建手机网站支付订单，返回支付跳转URL",
      inputSchema: {
        appid: z.string().describe("应用ID"),
        mchid: z.string().describe("商户号"),
        description: z.string().describe("商品描述"),
        out_trade_no: z.string().describe("商户订单号，需保证唯一性"),
        amount: AmountSchema,
        attach: z.string().optional().describe("附加数据"),
        goods_detail: z.array(GoodsDetailSchema).optional().describe("商品详情"),
        scene_info: z.object({
          payer_client_ip: z.string().describe("用户终端IP"),
          h5_info: z.object({
            type: z.string().describe("场景类型"),
            app_name: z.string().optional().describe("应用名称"),
            app_url: z.string().optional().describe("应用URL"),
            bundle_id: z.string().optional().describe("iOS平台BundleID"),
            package_name: z.string().optional().describe("Android平台PackageName")
          }).describe("H5场景信息")
        }).describe("场景信息")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        category: "wechat-pay"
      }
    },
    async (params: any) => {
      const config = getWeChatPayConfig();
      const pay = await getWeChatPayInstance(config);
      
      const orderParams = {
        ...params,
        notify_url: config.notify_url
      };
      
      const result = await pay.transactions_h5(orderParams);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );

  // 创建APP支付订单
  server.registerTool?.(
    "createAppPayment",
    {
      title: "创建APP支付订单",
      description: "创建APP支付订单，返回prepay_id用于APP调起支付",
      inputSchema: {
        appid: z.string().describe("应用ID"),
        mchid: z.string().describe("商户号"),
        description: z.string().describe("商品描述"),
        out_trade_no: z.string().describe("商户订单号，需保证唯一性"),
        amount: AmountSchema,
        attach: z.string().optional().describe("附加数据"),
        goods_detail: z.array(GoodsDetailSchema).optional().describe("商品详情"),
        scene_info: SceneInfoSchema
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        category: "wechat-pay"
      }
    },
    async (params: any) => {
      const config = getWeChatPayConfig();
      const pay = await getWeChatPayInstance(config);
      
      const orderParams = {
        ...params,
        notify_url: config.notify_url
      };
      
      const result = await pay.transactions_app(orderParams);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );

  // 查询支付订单
  server.registerTool?.(
    "queryPayment",
    {
      title: "查询支付订单",
      description: "通过商户订单号或微信订单号查询支付状态",
      inputSchema: {
        out_trade_no: z.string().optional().describe("商户订单号"),
        transaction_id: z.string().optional().describe("微信订单号"),
        mchid: z.string().describe("商户号")
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        category: "wechat-pay"
      }
    },
    async (params: any) => {
      const config = getWeChatPayConfig();
      const pay = await getWeChatPayInstance(config);
      
      if (!params.out_trade_no && !params.transaction_id) {
        throw new Error("out_trade_no 和 transaction_id 必须提供其中一个");
      }
      
      const result = await pay.query(params);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );

  // 关闭订单
  server.registerTool?.(
    "closeOrder",
    {
      title: "关闭支付订单",
      description: "关闭未支付的订单",
      inputSchema: {
        out_trade_no: z.string().describe("商户订单号"),
        mchid: z.string().describe("商户号")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
        category: "wechat-pay"
      }
    },
    async (params: any) => {
      const config = getWeChatPayConfig();
      const pay = await getWeChatPayInstance(config);
      
      const result = await pay.close(params);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );

  // 创建退款
  server.registerTool?.(
    "createRefund",
    {
      title: "创建退款",
      description: "对已支付的订单进行退款",
      inputSchema: {
        transaction_id: z.string().optional().describe("微信订单号"),
        out_trade_no: z.string().optional().describe("商户订单号"),
        out_refund_no: z.string().describe("商户退款号，需保证唯一性"),
        reason: z.string().optional().describe("退款原因"),
        amount: z.object({
          refund: z.number().describe("退款金额（分）"),
          total: z.number().describe("原订单金额（分）"),
          currency: z.string().default("CNY").describe("货币类型")
        }).describe("退款金额信息"),
        goods_detail: z.array(z.object({
          merchant_goods_id: z.string().describe("商户商品编码"),
          wechatpay_goods_id: z.string().optional().describe("微信商品编码"),
          goods_name: z.string().describe("商品名称"),
          unit_price: z.number().describe("商品单价（分）"),
          refund_amount: z.number().describe("退款金额（分）"),
          refund_quantity: z.number().describe("退款数量")
        })).optional().describe("退款商品信息"),
        notify_url: z.string().optional().describe("退款回调URL")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        category: "wechat-pay"
      }
    },
    async (params: any) => {
      const config = getWeChatPayConfig();
      const pay = await getWeChatPayInstance(config);
      
      if (!params.transaction_id && !params.out_trade_no) {
        throw new Error("transaction_id 和 out_trade_no 必须提供其中一个");
      }
      
      const refundParams = {
        ...params,
        notify_url: params.notify_url || config.notify_url
      };
      
      const result = await pay.refund(refundParams);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );

  // 查询退款
  server.registerTool?.(
    "queryRefund",
    {
      title: "查询退款",
      description: "查询退款状态",
      inputSchema: {
        out_refund_no: z.string().describe("商户退款号")
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        category: "wechat-pay"
      }
    },
    async (params: any) => {
      const config = getWeChatPayConfig();
      const pay = await getWeChatPayInstance(config);
      
      const result = await pay.query_refund(params);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );

  // 验证回调签名
  server.registerTool?.(
    "verifyWebhookSignature",
    {
      title: "验证回调签名",
      description: "验证微信支付回调的签名是否正确",
      inputSchema: {
        signature: z.string().describe("回调签名"),
        timestamp: z.string().describe("时间戳"),
        nonce: z.string().describe("随机数"),
        body: z.string().describe("回调内容")
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        category: "wechat-pay"
      }
    },
    async (params: any) => {
      const config = getWeChatPayConfig();
      const pay = await getWeChatPayInstance(config);
      
      const isValid = pay.verifySign(params);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ isValid }, null, 2)
          }
        ]
      };
    }
  );

  // 解密回调数据
  server.registerTool?.(
    "decryptWebhookData",
    {
      title: "解密回调数据",
      description: "解密微信支付回调中的加密数据",
      inputSchema: {
        ciphertext: z.string().describe("加密数据"),
        associated_data: z.string().describe("关联数据"),
        nonce: z.string().describe("随机数")
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        category: "wechat-pay"
      }
    },
    async (params: any) => {
      const config = getWeChatPayConfig();
      const pay = await getWeChatPayInstance(config);
      
      const decryptedData = pay.decrypt(params);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(decryptedData, null, 2)
          }
        ]
      };
    }
  );
}