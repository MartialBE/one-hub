import { useTranslation as useOriginalTranslation } from 'react-i18next';

// 自定义 useTranslation 钩子
function useCustomizeT() {
  const { t: originalT, ...rest } = useOriginalTranslation();

  // 修改后的 t 函数
  const t = (key, options) => {
    // 直接使用 key，不进行任何分割
    return originalT(key, { ...options, nsSeparator: false, keySeparator: false });
  };

  return { t, ...rest };
}

export default useCustomizeT;
