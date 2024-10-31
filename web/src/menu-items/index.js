import Setting from './setting';
import Dashboard from './dashboard';
import Billing from './billing';
import usage from './usage';
// ==============================|| MENU ITEMS ||============================== //

const menuItems = {
  items: [Dashboard, Setting, Billing, usage]
};

export default menuItems;
// import panel from './panel';

// // ==============================|| MENU ITEMS ||============================== //

// const menuItems = {
//   items: [panel],
//   urlMap: {}
// };

// // Initialize urlMap
// menuItems.urlMap = menuItems.items.reduce((map, item) => {
//   item.children.forEach((child) => {
//     map[child.url] = child;
//   });
//   return map;
// }, {});

// export default menuItems;