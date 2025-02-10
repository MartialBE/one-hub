import { lazy } from 'react';

// project imports
import Loadable from 'ui-component/Loadable';
import MinimalLayout from 'layout/MinimalLayout';

// login option 3 routing
const AuthLogin = Loadable(lazy(() => import('views/Authentication/Auth/Login')));
const AuthRegister = Loadable(lazy(() => import('views/Authentication/Auth/Register')));
const GitHubOAuth = Loadable(lazy(() => import('views/Authentication/Auth/GitHubOAuth')));
const LarkOAuth = Loadable(lazy(() => import('views/Authentication/Auth/LarkOAuth')));
const OIDCOAuth = Loadable(lazy(() => import('views/Authentication/Auth/OIDCOAuth')));
const ForgetPassword = Loadable(lazy(() => import('views/Authentication/Auth/ForgetPassword')));
const ResetPassword = Loadable(lazy(() => import('views/Authentication/Auth/ResetPassword')));
const Home = Loadable(lazy(() => import('views/Home')));
const About = Loadable(lazy(() => import('views/About')));
const NotFoundView = Loadable(lazy(() => import('views/Error')));
const Jump = Loadable(lazy(() => import('views/Jump')));
const Playground = Loadable(lazy(() => import('views/Playground')));
const ModelPrice = Loadable(lazy(() => import('views/ModelPrice')));

const WithMargins = ({ children }) => <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>{children}</div>;

// ==============================|| AUTHENTICATION ROUTING ||============================== //

const OtherRoutes = {
  path: '/',
  element: <MinimalLayout />,
  children: [
    {
      path: '',
      element: <Home />
    },
    {
      path: '/about',
      element: <About />
    },
    {
      path: '/login',
      element: <AuthLogin />
    },
    {
      path: '/register',
      element: <AuthRegister />
    },
    {
      path: '/reset',
      element: <ForgetPassword />
    },
    {
      path: '/user/reset',
      element: <ResetPassword />
    },
    {
      path: '/oauth/github',
      element: <GitHubOAuth />
    },
    {
      path: '/oauth/oidc',
      element: <OIDCOAuth />
    },
    {
      path: '/oauth/lark',
      element: <LarkOAuth />
    },
    {
      path: '/404',
      element: <NotFoundView />
    },
    {
      path: '/jump',
      element: <Jump />
    },
    {
      path: '/playground',
      element: <Playground />
    },
    {
      path: '/price',
      element: (
        <WithMargins>
          <ModelPrice />
        </WithMargins>
      )
    }
  ]
};

export default OtherRoutes;
