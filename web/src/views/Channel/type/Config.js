const defaultConfig = {
  input: {
    name: '',
    type: 1,
    key: '',
    base_url: '',
    other: '',
    proxy: '',
    test_model: '',
    model_mapping: [],
    models: [],
    groups: ['default'],
    plugin: {},
    tag: '',
    only_chat: false,
    pre_cost: 1
  },
  inputLabel: {
    name: '渠道名称',
    type: '渠道类型',
    base_url: '渠道API地址',
    key: '密钥',
    other: '其他参数',
    proxy: '代理地址',
    test_model: '测速模型',
    models: '模型',
    model_mapping: '模型映射关系',
    groups: '用户组',
    only_chat: '仅支持聊天',
    tag: '标签',
    provider_models_list: '',
    pre_cost: '预计费选项'
  },
  prompt: {
    type: '请选择渠道类型',
    name: '请为渠道命名',
    base_url: '可空，请输入中转API地址，例如通过cloudflare中转',
    key: '请输入渠道对应的鉴权密钥',
    other: '',
    proxy: '单独设置代理地址，支持http和socks5，例如：http://127.0.0.1:1080',
    test_model: '用于测试使用的模型，为空时无法测速,如：gpt-3.5-turbo，仅支持chat模型',
    models:
      '请选择该渠道所支持的模型,你也可以输入通配符*来匹配模型，例如：gpt-3.5*，表示支持所有gpt-3.5开头的模型，*号只能在最后一位使用，前面必须有字符，例如：gpt-3.5*是正确的，*gpt-3.5是错误的',
    model_mapping: '模型映射关系：例如用户请求A模型，实际转发给渠道的模型为B。',
    model_headers: '自定义模型请求头，例如：{"key": "value"}',
    groups: '请选择该渠道所支持的用户组',
    only_chat: '如果选择了仅支持聊天，那么遇到有函数调用的请求会跳过该渠道',
    provider_models_list: '必须填写所有数据后才能获取模型列表',
    tag: '你可以为你的渠道打一个标签，打完标签后，可以通过标签进行批量管理渠道，注意：设置标签后某些设置只能通过渠道标签修改，无法在渠道列表中修改。',
    pre_cost:
      '这里选择预计费选项，用于预估费用，如果你觉得计算图片占用太多资源，可以选择关闭图片计费。但是请注意：有些渠道在stream下是不会返回tokens的，这会导致输入tokens计算错误。'
  },
  modelGroup: 'OpenAI'
};

const typeConfig = {
  1: {
    inputLabel: {
      provider_models_list: '从OpenAI获取模型列表'
    }
  },
  8: {
    inputLabel: {
      provider_models_list: '从渠道获取模型列表'
    },
    prompt: {
      other: ''
    }
  },
  3: {
    inputLabel: {
      base_url: 'AZURE_OPENAI_ENDPOINT',
      other: '默认 API 版本',
      provider_models_list: '从Azure获取已部署模型列表'
    },
    prompt: {
      base_url: '请填写AZURE_OPENAI_ENDPOINT',
      other: '请输入默认API版本，例如：2024-05-01-preview'
    }
  },
  11: {
    input: {
      models: ['PaLM-2'],
      test_model: 'PaLM-2'
    },
    modelGroup: 'Google PaLM'
  },
  14: {
    input: {
      models: [
        'claude-instant-1.2',
        'claude-2.0',
        'claude-2.1',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307'
      ],
      test_model: 'claude-3-haiku-20240307'
    },
    modelGroup: 'Anthropic'
  },
  15: {
    input: {
      models: [
        'ERNIE-4.0-Turbo-8K',
        'ERNIE-4.0-8K-Latest',
        'ERNIE-4.0-8K-0613',
        'ERNIE-3.5-8K-0613',
        'ERNIE-Bot-turbo',
        'ERNIE-Lite-8K-0922',
        'ERNIE-Lite-8K',
        'ERNIE-Lite-8K-0308',
        'ERNIE-3.5-8K',
        'ERNIE-Bot',
        'ERNIE-4.0-8K',
        'ERNIE-4.0-8K-Preview',
        'ERNIE-4.0-8K-Preview-0518',
        'ERNIE-4.0-8K-0329',
        'ERNIE-4.0-8K-0104',
        'ERNIE-Bot-4',
        'ERNIE-Bot-8k',
        'ERNIE-3.5-128K',
        'ERNIE-3.5-8K-preview',
        'ERNIE-3.5-8K-0329',
        'ERNIE-3.5-4K-0205',
        'ERNIE-3.5-8K-0205',
        'ERNIE-3.5-8K-1222',
        'ERNIE-Speed',
        'ERNIE-Speed-8K',
        'ERNIE-Speed-128K',
        'ERNIE-Tiny-8K',
        'ERNIE-Function-8K',
        'ERNIE-Character-8K',
        'ERNIE-Character-Fiction-8K',
        'ERNIE-Bot-turbo-AI',
        'Embedding-V1'
      ],
      test_model: 'ERNIE-Speed'
    },
    prompt: {
      key: '按照如下格式输入：APIKey|SecretKey'
    },
    modelGroup: 'Baidu'
  },
  16: {
    input: {
      models: ['glm-3-turbo', 'glm-4', 'glm-4v', 'embedding-2', 'cogview-3'],
      test_model: 'glm-3-turbo'
    },
    modelGroup: 'Zhipu'
  },
  17: {
    inputLabel: {
      other: '插件参数'
    },
    input: {
      models: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-max-longcontext', 'text-embedding-v1'],
      test_model: 'qwen-turbo'
    },
    prompt: {
      other: '请输入插件参数，即 X-DashScope-Plugin 请求头的取值'
    },
    modelGroup: 'Ali'
  },
  18: {
    inputLabel: {
      other: '版本号'
    },
    input: {
      models: ['SparkDesk', 'SparkDesk-v1.1', 'SparkDesk-v2.1', 'SparkDesk-v3.1', 'SparkDesk-v3.5']
    },
    prompt: {
      key: '按照如下格式输入：APPID|APISecret|APIKey',
      other: '请输入版本号，例如：v3.1'
    },
    modelGroup: 'Xunfei'
  },
  19: {
    input: {
      models: ['360GPT_S2_V9', 'embedding-bert-512-v1', 'embedding_s1_v1', 'semantic_similarity_s1_v1'],
      test_model: '360GPT_S2_V9'
    },
    modelGroup: '360'
  },
  22: {
    prompt: {
      key: '按照如下格式输入：APIKey-AppId，例如：fastgpt-0sp2gtvfdgyi4k30jwlgwf1i-64f335d84283f05518e9e041'
    }
  },
  23: {
    input: {
      models: ['ChatStd', 'ChatPro'],
      test_model: 'ChatStd'
    },
    prompt: {
      key: '按照如下格式输入：AppId|SecretId|SecretKey'
    },
    modelGroup: 'Tencent'
  },
  25: {
    inputLabel: {
      other: '版本号',
      provider_models_list: '从Gemini获取模型列表'
    },
    input: {
      models: ['gemini-pro', 'gemini-pro-vision', 'gemini-1.0-pro', 'gemini-1.5-pro'],
      test_model: 'gemini-pro'
    },
    prompt: {
      other: '请输入版本号，例如：v1'
    },
    modelGroup: 'Google Gemini'
  },
  26: {
    input: {
      models: ['Baichuan2-Turbo', 'Baichuan2-Turbo-192k', 'Baichuan2-53B', 'Baichuan-Text-Embedding'],
      test_model: 'Baichuan2-Turbo'
    },
    modelGroup: 'Baichuan'
  },
  24: {
    inputLabel: {
      other: '位置/区域'
    },
    input: {
      models: ['tts-1', 'tts-1-hd']
    },
    prompt: {
      test_model: '',
      base_url: '',
      other: '请输入你 Speech Studio 的位置/区域，例如：eastasia'
    }
  },
  27: {
    input: {
      models: ['abab6.5s-chat', 'MiniMax-Text-01', 'speech-01-turbo', 'speech-01-240228', 'speech-01-turbo-240228'],
      test_model: 'abab6.5s-chat'
    },
    modelGroup: 'MiniMax'
  },
  28: {
    input: {
      models: ['deepseek-coder', 'deepseek-chat'],
      test_model: 'deepseek-chat'
    },
    inputLabel: {
      provider_models_list: '从Deepseek获取模型列表'
    },
    modelGroup: 'Deepseek'
  },
  29: {
    inputLabel: {
      provider_models_list: '从Moonshot获取模型列表'
    },
    input: {
      models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
      test_model: 'moonshot-v1-8k'
    },
    modelGroup: 'Moonshot'
  },
  30: {
    input: {
      models: [
        'open-mistral-7b',
        'open-mixtral-8x7b',
        'mistral-small-latest',
        'mistral-medium-latest',
        'mistral-large-latest',
        'mistral-embed'
      ],
      test_model: 'open-mistral-7b'
    },
    inputLabel: {
      provider_models_list: '从Mistral获取模型列表'
    },
    modelGroup: 'Mistral'
  },
  31: {
    input: {
      models: ['llama2-7b-2048', 'llama2-70b-4096', 'mixtral-8x7b-32768', 'gemma-7b-it'],
      test_model: 'llama2-7b-2048'
    },
    inputLabel: {
      provider_models_list: '从Groq获取模型列表'
    },
    modelGroup: 'Groq'
  },
  32: {
    input: {
      models: [
        'claude-instant-1.2',
        'claude-2.0',
        'claude-2.1',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307'
      ],
      test_model: 'claude-3-haiku-20240307'
    },
    prompt: {
      key: '按照如下格式输入：Region|AccessKeyID|SecretAccessKey|SessionToken 其中SessionToken可不填空'
    },
    modelGroup: 'Anthropic'
  },
  33: {
    input: {
      models: ['yi-34b-chat-0205', 'yi-34b-chat-200k', 'yi-vl-plus'],
      test_model: 'yi-34b-chat-0205'
    },
    modelGroup: 'Lingyiwanwu'
  },
  34: {
    input: {
      models: [
        'mj_imagine',
        'mj_variation',
        'mj_reroll',
        'mj_blend',
        'mj_modal',
        'mj_zoom',
        'mj_shorten',
        'mj_high_variation',
        'mj_low_variation',
        'mj_pan',
        'mj_inpaint',
        'mj_custom_zoom',
        'mj_describe',
        'mj_upscale',
        'swap_face',
        'mj_upload'
      ]
    },
    prompt: {
      key: '密钥填写midjourney-proxy的密钥，如果没有设置密钥，可以随便填',
      base_url: '地址填写midjourney-proxy部署的地址',
      test_model: '',
      model_mapping: ''
    },
    modelGroup: 'Midjourney'
  },
  35: {
    input: {
      models: [
        '@cf/stabilityai/stable-diffusion-xl-base-1.0',
        '@cf/lykon/dreamshaper-8-lcm',
        '@cf/bytedance/stable-diffusion-xl-lightning',
        '@cf/qwen/qwen1.5-7b-chat-awq',
        '@cf/qwen/qwen1.5-14b-chat-awq',
        '@hf/google/gemma-7b-it',
        '@hf/thebloke/deepseek-coder-6.7b-base-awq',
        '@hf/thebloke/llama-2-13b-chat-awq',
        '@cf/openai/whisper'
      ],
      test_model: '@hf/google/gemma-7b-it'
    },
    prompt: {
      key: '按照如下格式输入：CLOUDFLARE_ACCOUNT_ID|CLOUDFLARE_API_TOKEN',
      base_url: ''
    },
    modelGroup: 'Cloudflare AI'
  },
  36: {
    input: {
      models: ['command-r', 'command-r-plus'],
      test_model: 'command-r'
    },
    inputLabel: {
      provider_models_list: '从Cohere获取模型列表'
    },
    modelGroup: 'Cohere'
  },
  37: {
    input: {
      models: ['sd3', 'sd3-turbo', 'stable-image-core']
    },
    prompt: {
      test_model: ''
    },
    modelGroup: 'Stability AI'
  },
  38: {
    input: {
      models: ['coze-*']
    },
    prompt: {
      models: '模型名称为coze-{bot_id}，你也可以直接使用 coze-* 通配符来匹配所有coze开头的模型',
      model_mapping:
        '模型名称映射， 你可以取一个容易记忆的名字来代替coze-{bot_id}，例如：{"coze-translate": "coze-xxxxx"},注意：如果使用了模型映射，那么上面的模型名称必须使用映射前的名称，上述例子中，你应该在模型中填入coze-translate(如果已经使用了coze-*，可以忽略)。'
    },
    modelGroup: 'Coze'
  },
  39: {
    input: {
      models: ['phi3', 'llama3']
    },
    prompt: {
      base_url: '请输入你部署的Ollama地址，例如：http://127.0.0.1:11434，如果你使用了cloudflare Zero Trust，可以在下方插件填入授权信息',
      key: '请随意填写'
    }
  },
  40: {
    input: {
      models: ['hunyuan-lite', 'hunyuan-pro', 'hunyuan-standard-256K', 'hunyuan-standard'],
      test_model: 'hunyuan-lite'
    },
    prompt: {
      key: '按照如下格式输入：SecretId|SecretKey'
    },
    modelGroup: 'Hunyuan'
  },
  41: {
    input: {
      models: ['suno_lyrics', 'chirp-v3-0', 'chirp-v3-5']
    },
    prompt: {
      key: '密钥填写Suno-API的密钥，如果没有设置密钥，可以随便填',
      base_url: '地址填写Suno-API部署的地址',
      test_model: '',
      model_mapping: ''
    },
    modelGroup: 'Suno'
  },
  42: {
    input: {
      models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
    },
    prompt: {
      key: '请参考wiki中的文档获取key. https://github.com/MartialBE/one-hub/wiki/VertexAI',
      other: 'Region|ProjectID',
      base_url: ''
    },
    modelGroup: 'VertexAI'
  },
  45: {
    input: {
      models: ['black-forest-labs/FLUX.1-dev', 'black-forest-labs/FLUX.1-schnell']
    },
    inputLabel: {
      provider_models_list: '从Siliconflow获取模型列表'
    },
    prompt: {
      base_url: ''
    },
    modelGroup: 'Siliconflow'
  },
  47: {
    input: {
      models: ['jina-reranker-v2-base-multilingual']
    },
    prompt: {
      test_model: ''
    },
    modelGroup: 'Jina'
  },
  49: {
    input: {
      models: ['gpt-4o', 'gpt-4o-mini', 'text-embedding-3-large', 'text-embedding-3-small', 'Cohere-command-r-plus', 'Cohere-command-r'],
      test_model: 'gpt-4o-mini'
    },
    prompt: {
      key: '密钥信息请参考https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens',
      base_url: 'https://models.inference.ai.azure.com'
    },
    modelGroup: 'Github'
  },
  51: {
    input: {
      models: [
        'recraftv3',
        'recraft20b',
        'recraft_vectorize',
        'recraft_removeBackground',
        'recraft_clarityUpscale',
        'recraft_generativeUpscale',
        'recraft_styles'
      ]
    }
  },
  53: {
    input: {
      models: [
        'kling-video_kling-v1_std_5',
        'kling-video_kling-v1_std_10',
        'kling-video_kling-v1_pro_5',
        'kling-video_kling-v1_pro_10',

        'kling-video_kling-v1-5_std_5',
        'kling-video_kling-v1-5_std_10',
        'kling-video_kling-v1-5_pro_5',
        'kling-video_kling-v1-5_pro_10',

        'kling-video_kling-v1-10_std_5',
        'kling-video_kling-v1-10_std_10',
        'kling-video_kling-v1-10_pro_5',
        'kling-video_kling-v1-10_pro_10'
      ]
    },
    prompt: {
      key: '官方密钥格式： accessKey|secretKey'
    },
    modelGroup: 'Kling'
  }
};

export { defaultConfig, typeConfig };
