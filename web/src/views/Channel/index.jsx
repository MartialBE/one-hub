import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Tabs, Tab, Box, Card } from '@mui/material';
import { IconListDetails, IconList } from '@tabler/icons-react';
import ChannelList from './ChannelList';
import ChannelTag from './ChannelTag';
import AdminContainer from 'ui-component/AdminContainer';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} id={`channel-tabpanel-${index}`} aria-labelledby={`channel-tab-${index}`} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired
};

function a11yProps(index) {
  return {
    id: `channel-tab-${index}`,
    'aria-controls': `channel-tabpanel-${index}`
  };
}

const ChannelTab = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const hash = location.hash.replace('#', '');
  const tabMap = useMemo(
    () => ({
      channel: 0,
      channel_tag: 1
    }),
    []
  );
  const [value, setValue] = useState(tabMap[hash] || 0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    const hashArray = Object.keys(tabMap);
    navigate(`#${hashArray[newValue]}`);
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = location.hash.replace('#', '');
      setValue(tabMap[hash] || 0);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [location, tabMap]);

  return (
    <>
      <Card>
        <AdminContainer>
          <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={value} onChange={handleChange} variant="scrollable" scrollButtons="auto">
                <Tab label={t('channel_index.channelList')} {...a11yProps(0)} icon={<IconList />} iconPosition="start" />
                <Tab label={t('channel_index.channelTags')} {...a11yProps(1)} icon={<IconListDetails />} iconPosition="start" />
              </Tabs>
            </Box>
            <CustomTabPanel value={value} index={0}>
              <ChannelList />
            </CustomTabPanel>
            <CustomTabPanel value={value} index={1}>
              <ChannelTag />
            </CustomTabPanel>
          </Box>
        </AdminContainer>
      </Card>
    </>
  );
};

export default ChannelTab;
