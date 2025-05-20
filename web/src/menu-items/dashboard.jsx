import { Icon } from '@iconify/react';

const icons = {
  IconDashboard: () => <Icon width={20} icon="solar:widget-2-bold-duotone" />,
  IconChartHistogram: () => <Icon width={20} icon="solar:chart-2-bold-duotone" />,
  IconBallFootball: () => <Icon width={20} icon="solar:chat-round-line-bold-duotone" />,
  IconSystemInfo: () => <Icon width={20} icon="solar:code-scan-bold" />
};

const dashboard = {
  id: 'dashboard',
  title: 'Dashboard',
  type: 'group',
  children: [
    {
      id: 'dashboard',
      title: '仪表盘',
      type: 'item',
      url: '/panel/dashboard',
      icon: icons.IconDashboard,
      breadcrumbs: false,
      isAdmin: false
    },
    {
      id: 'analytics',
      title: '分析',
      type: 'item',
      url: '/panel/analytics',
      icon: icons.IconChartHistogram,
      breadcrumbs: false,
      isAdmin: true
    },
    {
      id: 'playground',
      title: 'Playground',
      type: 'item',
      url: '/panel/playground',
      icon: icons.IconBallFootball,
      breadcrumbs: false
    },
    {
      id: 'systemInfo',
      title: '系统信息',
      type: 'item',
      url: '/panel/system_info',
      icon: icons.IconSystemInfo,
      breadcrumbs: false,
      isAdmin: true
    },
  ]
};

export default dashboard;
