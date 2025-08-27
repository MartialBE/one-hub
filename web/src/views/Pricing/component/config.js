const extraRatiosConfig = [
  {
    name: '缓存令牌',
    key: 'cached_tokens',
    isPrompt: true
  },
  {
    name: '缓存写入令牌(claude)',
    key: 'cached_write_tokens',
    isPrompt: true
  },
  {
    name: '缓存读取令牌(claude)',
    key: 'cached_read_tokens',
    isPrompt: true
  },
  {
    name: '音频输入令牌',
    key: 'input_audio_tokens',
    isPrompt: true
  },
  {
    name: '音频输出令牌',
    key: 'output_audio_tokens',
    isPrompt: false
  },
  {
    name: '推理令牌',
    key: 'reasoning_tokens',
    isPrompt: false
  },
  {
    name: '输入文本令牌',
    key: 'input_text_tokens',
    isPrompt: true
  },
  {
    name: '输出文本令牌',
    key: 'output_text_tokens',
    isPrompt: false
  },
  {
    name: '输入图像令牌',
    key: 'input_image_tokens',
    isPrompt: true
  },
  {
    name: '输出图像令牌',
    key: 'output_image_tokens',
    isPrompt: false
  }
];

export { extraRatiosConfig };
