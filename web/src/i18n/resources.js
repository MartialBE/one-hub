export const normalizeLocale = (locale) => {
  if (!locale) return 'zh-CN';

  switch (locale) {
    case 'zh-CN':
    case 'zh': {
      return 'zh-CN';
    }

    case 'en': {
      return 'en-US';
    }

    default: {
      return locale;
    }
  }
};

export const localeOptions = [
  {
    label: 'English',
    value: 'en-US'
  },
  {
    label: '简体中文',
    value: 'zh-CN'
  },
  {
    label: '繁體中文',
    value: 'zh-TW'
  },
  {
    label: '日本語',
    value: 'ja-JP'
  }
];
