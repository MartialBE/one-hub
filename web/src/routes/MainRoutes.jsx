import { lazy } from 'react';

// project imports
import MainLayout from 'layout/MainLayout';
import Loadable from 'ui-component/Loadable';

const Channel = Loadable(lazy(() => import('views/Channel')));
const Log = Loadable(lazy(() => import('views/Log')));
const Redemption = Loadable(lazy(() => import('views/Redemption')));
const Setting = Loadable(lazy(() => import('views/Setting')));
const Token = Loadable(lazy(() => import('views/Token')));
const Topup = Loadable(lazy(() => import('views/Topup')));
const User = Loadable(lazy(() => import('views/User')));
const Profile = Loadable(lazy(() => import('views/Profile')));
const NotFoundView = Loadable(lazy(() => import('views/Error')));
const Analytics = Loadable(lazy(() => import('views/Analytics')));
const Telegram = Loadable(lazy(() => import('views/Telegram')));
const Pricing = Loadable(lazy(() => import('views/Pricing')));
const Midjourney = Loadable(lazy(() => import('views/Midjourney')));
const ModelPrice = Loadable(lazy(() => import('views/ModelPrice')));
const Playground = Loadable(lazy(() => import('views/Playground')));
const Payment = Loadable(lazy(() => import('views/Payment')));
const Task = Loadable(lazy(() => import('views/Task')));
const UserGroup = Loadable(lazy(() => import('views/UserGroup')));
const ModelOwnedby = Loadable(lazy(() => import('views/ModelOwnedby')));

// dashboard routing
const Dashboard = Loadable(lazy(() => import('views/Dashboard')));

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/panel',
  element: <MainLayout />,
  children: [
    {
      path: '',
      element: <Dashboard />
    },
    {
      path: 'dashboard',
      element: <Dashboard />
    },
    {
      path: 'channel',
      element: <Channel />
    },
    {
      path: 'log',
      element: <Log />
    },
    {
      path: 'redemption',
      element: <Redemption />
    },
    {
      path: 'setting',
      element: <Setting />
    },
    {
      path: 'token',
      element: <Token />
    },
    {
      path: 'topup',
      element: <Topup />
    },
    {
      path: 'user',
      element: <User />
    },
    {
      path: 'profile',
      element: <Profile />
    },
    {
      path: 'analytics',
      element: <Analytics />
    },
    {
      path: '404',
      element: <NotFoundView />
    },
    {
      path: 'telegram',
      element: <Telegram />
    },
    {
      path: 'pricing',
      element: <Pricing />
    },
    {
      path: 'midjourney',
      element: <Midjourney />
    },
    {
      path: 'model_price',
      element: <ModelPrice />
    },
    {
      path: 'playground',
      element: <Playground />
    },
    {
      path: 'payment',
      element: <Payment />
    },
    {
      path: 'task',
      element: <Task />
    },
    {
      path: 'user_group',
      element: <UserGroup />
    },
    {
      path: 'model_ownedby',
      element: <ModelOwnedby />
    }
  ]
};

export default MainRoutes;
