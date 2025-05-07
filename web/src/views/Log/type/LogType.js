import { useTranslation } from 'react-i18next';

// Default translations for static import cases
const defaultTranslations = {
  'logPage.logType.all': 'All',
  'logPage.logType.recharge': 'Recharge',
  'logPage.logType.consumption': 'Consumption',
  'logPage.logType.management': 'Management',
  'logPage.logType.system': 'System'
};

// Function to get translations with a provided translation function
const getLogTypeWithTranslation = (translationFunc) => {
  const t = translationFunc || ((key) => defaultTranslations[key] || key);
  return {
    0: { value: '0', text: t('logPage.logType.all'), color: '' },
    1: { value: '1', text: t('logPage.logType.recharge'), color: 'primary' },
    2: { value: '2', text: t('logPage.logType.consumption'), color: 'orange' },
    3: { value: '3', text: t('logPage.logType.management'), color: 'default' },
    4: { value: '4', text: t('logPage.logType.system'), color: 'secondary' }
  };
};

// Hook to get log types with translations
export const useLogType = () => {
  const { t } = useTranslation();
  return getLogTypeWithTranslation(t);
};

// Default export for backward compatibility
export default getLogTypeWithTranslation();
