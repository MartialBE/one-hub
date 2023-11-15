import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/User';

import { Button, Container, Dropdown, Icon, Menu, Segment } from 'semantic-ui-react';
import { API, getLogo, getSystemName, isAdmin, isMobile, showSuccess } from '../helpers';
import '../index.css';



// Header Buttons
let headerButtons = [
  {
    name: '首页',
    to: '/',
    icon: 'home',
    color: 'var(--czl-primary-color)'
  },
  {
    name: '渠道',
    to: '/channel',
    icon: 'sitemap',
    color: 'var(--czl-primary-color)',
    admin: true
  },
  {
    name: 'Key',
    to: '/token',
    icon: 'key',
    color: 'var(--czl-primary-color)'
  },
  {
    name: '兑换',
    to: '/redemption',
    icon: 'dollar sign',
    color: 'var(--czl-primary-color)',
    admin: true
  },
  {
    name: '充值',
    to: '/topup',
    icon: 'cart',
    color: 'var(--czl-primary-color)'
  },
  {
    name: '用户',
    to: '/user',
    icon: 'users',
    color: 'var(--czl-primary-color)',
    admin: true
  },
  {
    name: '日志',
    to: '/log',
    icon: 'book',
    color: 'var(--czl-primary-color)'
  },
  {
    name: '个人',
    to: '/setting',
    icon: 'user',
    color: 'var(--czl-primary-color)'
  },
  {
    name: '关于',
    to: '/about',
    icon: 'info circle',
    color: 'var(--czl-primary-color)'
  }
];


if (localStorage.getItem('chat_link')) {
  headerButtons.splice(1, 0, {
    name: '聊天',
    to: '/chat',
    icon: 'comments'
  });
}

const Header = () => {
  const [userState, userDispatch] = useContext(UserContext);
  let navigate = useNavigate();

  const [showSidebar, setShowSidebar] = useState(false);
  const systemName = getSystemName();
  const logo = getLogo();
  const [activeItem, setActiveItem] = useState(null);


  async function logout() {
    setShowSidebar(false);
    await API.get('/api/user/logout');
    showSuccess('注销成功!');
    userDispatch({ type: 'logout' });
    localStorage.removeItem('user');
    navigate('/login');
  }

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const renderButtons = (isMobile) => {
    return headerButtons.map((button) => {
      if (button.admin && !isAdmin()) return <></>;
      const isActive = activeItem === button.name;
      if (isMobile) {
        return (
          <Menu.Item
            onClick={() => {
              navigate(button.to);
              setShowSidebar(false);
            }}
          >
            {button.name}
          </Menu.Item>
        );
      }
      return (
        <Menu.Item
          key={button.name}
          as={Link}
          to={button.to}
          onClick={() => setActiveItem(button.name)}
        >
          <div className={isActive ? 'active-menu-item' : ''}>
            {button.icon && <Icon name={button.icon} />}
            {button.name}
          </div>
        </Menu.Item>
      );
    });
  };


  if (isMobile()) {
    return (
      <>
        <Menu
          borderless
          size='large'
          style={
            showSidebar
              ? {
                borderBottom: 'none',
                marginBottom: '0',
                borderTop: 'none',
                height: '51px'
              }
              : { borderTop: 'none', height: '52px' }
          }
        >
          <Container>
            <Menu.Item as={Link} to='/'>
              <img
                src={logo}
                alt='logo'
                style={{ marginRight: '0.75em' }}
              />
              <div style={{ fontSize: '20px' }}>
                <b>{systemName}</b>
              </div>
            </Menu.Item>
            <Menu.Menu position='right'>
              <Menu.Item onClick={toggleSidebar}>
                <Icon name={showSidebar ? 'close' : 'sidebar'} />
              </Menu.Item>
            </Menu.Menu>
          </Container>
        </Menu>
        {showSidebar ? (
          <Segment style={{ marginTop: 0, borderTop: '0' }}>
            <Menu secondary vertical style={{ width: '100%', margin: 0, backgroundColor: 'var(--czl-main)' }}>
              {renderButtons(true)}
              <Menu.Item>
                {userState.user ? (
                  <Button onClick={logout} style={{ backgroundColor: 'var(--czl-primary-color)' }}>注销</Button>
                ) : (
                  <>
                    <Button
                      onClick={() => {
                        setShowSidebar(false);
                        navigate('/login');
                      }}
                      style={{ backgroundColor: 'var(--czl-primary-color)' }}
                    >
                      登录
                    </Button>
                    <Button
                      onClick={() => {
                        setShowSidebar(false);
                        navigate('/register');
                      }}
                      style={{ backgroundColor: 'var(--czl-primary-color)' }}
                    >
                      注册
                    </Button>
                  </>
                )}
              </Menu.Item>
            </Menu>

          </Segment>
        ) : (
          <></>
        )}
      </>
    );
  }

  return (
    <>
      <Menu borderless style={{ borderTop: 'none' }}>
        <Container>
          <Menu.Item as={Link} to='/' className={'hide-on-mobile'}>
            <img src={logo} alt='logo' style={{ marginRight: '0.75em' }} />
            <div style={{ fontSize: '20px' }}>
              <b>{systemName}</b>
            </div>
          </Menu.Item>
          {renderButtons(false)}
          <Menu.Menu position='right'>
            {userState.user ? (
              <Dropdown
                text={userState.user.username}
                pointing
                className='link item'
              >
                <Dropdown.Menu>
                  <Dropdown.Item onClick={logout}>注销</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <Menu.Item
                name='登录'
                as={Link}
                to='/login'
                className='btn btn-link'
              />
            )}
          </Menu.Menu>
        </Container>
      </Menu>
    </>
  );
};

export default Header;
