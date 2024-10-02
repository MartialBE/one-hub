const PaymentType = {
  epay: '易支付',
  alipay: '支付宝',
  wxpay: '微信支付',
  stripe: 'Stripe',
};

const CurrencyType = {
  CNY: '人民币',
  USD: '美元'
};

const PaymentConfig = {
  epay: {
    pay_domain: {
      name: '支付域名',
      description: '支付域名',
      type: 'text',
      value: ''
    },
    partner_id: {
      name: '商户号',
      description: '商户号',
      type: 'text',
      value: ''
    },
    key: {
      name: '密钥',
      description: '密钥',
      type: 'text',
      value: ''
    },
    pay_type: {
      name: '支付类型',
      description: '支付类型,如果需要跳转到易支付收银台,请选择收银台',
      type: 'select',
      value: '',
      options: [
        {
          name: '收银台',
          value: ''
        },
        {
          name: '支付宝',
          value: 'alipay'
        },
        {
          name: '微信',
          value: 'wxpay'
        },
        {
          name: 'QQ',
          value: 'qqpay'
        },
        {
          name: '京东',
          value: 'jdpay'
        },
        {
          name: '银联',
          value: 'bank'
        },
        {
          name: 'Paypal',
          value: 'paypal'
        },
        {
          name: 'USDT',
          value: 'usdt'
        }
      ]
    }
  },
  alipay: {
    app_id: {
      name: '应用ID',
      description: '支付宝应用ID',
      type: 'text',
      value: ''
    },
    private_key: {
      name: '应用私钥',
      description: '应用私钥，开发者自己生成，详细参考官方文档 https://opendocs.alipay.com/common/02kipl?pathHash=84adb0fd',
      type: 'text',
      value: ''
    },
    public_key: {
      name: '支付宝公钥',
      description: '支付宝公钥，详细参考官方文档 https://opendocs.alipay.com/common/02kdnc?pathHash=fb0c752a',
      type: 'text',
      value: ''
    },
    pay_type: {
      name: '支付类型',
      description: '支付类型,需要您再支付宝开发者中心开通相关权限才可以使用对应类型支付方式',
      type: 'select',
      value: '',
      options: [
        {
          name: '当面付',
          value: 'facepay'
        },
        {
          name: '电脑网站支付',
          value: 'pagepay'
        },
        {
          name: '手机网站支付',
          value: 'wappay'
        }
      ]
    }
  },
  wxpay: {
    app_id: {
      name: 'AppID',
      description: '应用ID 详见https://pay.weixin.qq.com/wiki/doc/apiv3/open/pay/chapter2_7_1.shtml',
      type: 'text',
      value: ''
    },
    mch_id: {
      name: '商户号',
      description: '微信商户号 详见https://pay.weixin.qq.com/wiki/doc/apiv3/open/pay/chapter2_7_1.shtml',
      type: 'text',
      value: ''
    },
    mch_certificate_serial_number: {
      name: '商户证书序列号',
      description: '商户证书序列号 详见https://pay.weixin.qq.com/wiki/doc/apiv3/open/pay/chapter2_7_1.shtml',
      type: 'text',
      value: ''
    },
    mch_apiv3_key: {
      name: '商户APIv3密钥',
      description: '商户APIv3密钥 详见https://pay.weixin.qq.com/wiki/doc/apiv3/open/pay/chapter2_7_1.shtml',
      type: 'text',
      value: ''
    },
    mch_private_key: {
      name: '商户私钥',
      description: '商户私钥 详见https://pay.weixin.qq.com/wiki/doc/apiv3/open/pay/chapter2_7_1.shtml',
      type: 'text',
      value: ''
    },
    pay_type: {
      name: '支付类型',
      description: '支付类型',
      type: 'select',
      value: '',
      options: [
        {
          name: 'Native支付',
          value: 'Native'
        }
      ]
    },
  },
  stripe: {
    secret_key: {
      name: 'SecretKey',
      description: 'API 私钥',
      type: 'text',
      value: ''
    },
    webhook_secret: {
      name: 'WebHookSecret',
      description: '回调验证密钥，不用填写，创建网关后会自动在stripe后台创建webhook并获取webhook密钥',
      type: 'text',
      value: ''
    },
  }
};

export { PaymentConfig, PaymentType, CurrencyType };
