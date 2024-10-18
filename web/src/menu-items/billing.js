import { IconCreditCard, IconBrandGithubCopilot } from '@tabler/icons-react';

const icons = { IconCreditCard, IconBrandGithubCopilot };

const Billing = {
  id: 'billing',
  title: 'Billing',
  type: 'group',
  children: [
    {
      id: 'topup',
      title: '充值',
      type: 'item',
      url: '/panel/topup',
      icon: icons.IconCreditCard,
      breadcrumbs: false
    },
    {
      id: 'model_price',
      title: '可用模型',
      type: 'item',
      url: '/panel/model_price',
      icon: icons.IconBrandGithubCopilot,
      breadcrumbs: false,
      isAdmin: false
    }
  ]
};

export default Billing;
