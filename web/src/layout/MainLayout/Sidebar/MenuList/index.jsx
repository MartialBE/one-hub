// material-ui
import { Typography } from '@mui/material';

// project imports
import NavGroup from './NavGroup';
import menuItem from 'menu-items';
import { isAdmin } from 'utils/common';
import { useTranslation } from 'react-i18next';

// ==============================|| SIDEBAR MENU LIST ||============================== //
const MenuList = () => {
  const userIsAdmin = isAdmin();
  const { t } = useTranslation();

  // 遍历并修改 children 的 title 字段
  menuItem.items.forEach((group) => {
    group.children.forEach((item) => {
      item.title = t(item.id);
    });
  });

  return (
    <>
      {menuItem.items.map((item) => {
        if (item.type !== 'group') {
          return (
            <Typography key={item.id} variant="h6" color="error" align="center">
              {t('menu.error')}
            </Typography>
          );
        }

        const filteredChildren = item.children.filter((child) => !child.isAdmin || userIsAdmin);

        if (filteredChildren.length === 0) {
          return null;
        }

        return <NavGroup key={item.id} item={{ ...item, children: filteredChildren }} />;
      })}
    </>
  );
};

export default MenuList;
