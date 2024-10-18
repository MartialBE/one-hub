import { IconArticle, IconBrush, IconList } from '@tabler/icons-react';

const icons = { IconArticle, IconBrush, IconList };

const usage = {
  id: 'usage',
  title: 'Usage',
  type: 'group',
  children: [
    {
      id: 'log',
      title: '日志',
      type: 'item',
      url: '/panel/log',
      icon: icons.IconArticle,
      breadcrumbs: false
    },

    {
      id: 'midjourney',
      title: 'Midjourney',
      type: 'item',
      url: '/panel/midjourney',
      icon: icons.IconBrush,
      breadcrumbs: false
    },
    {
      id: 'task',
      title: '异步任务',
      type: 'item',
      url: '/panel/task',
      icon: icons.IconList,
      breadcrumbs: false
    }
  ]
};

export default usage;
