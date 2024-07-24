import React, { useState, useEffect } from 'react';
// import PropTypes from 'prop-types';
// import { useSelector } from 'react-redux';

// material-ui
import { styled, useTheme } from '@mui/material/styles';
import {
  Avatar,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  // ListItemIcon,
  Chip,
  Button,
  Box
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { IconHeadset } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { API } from 'utils/api';



const CardStyle = styled(Card)(({ theme }) => ({
  background: theme.typography.menuChip.background,
  marginBottom: '22px',
  overflow: 'hidden',
  position: 'relative',
  '&:after': {
    content: '""',
    position: 'absolute',
    width: '157px',
    height: '157px',
    background: theme.palette.primary[200],
    borderRadius: '50%',
    top: '-105px',
    right: '-96px'
  }
}));


// ==============================|| SIDEBAR MENU Card ||============================== //

const MenuCard = () => {
  const theme = useTheme();
  // const account = useSelector((state) => state.account);
  const navigate = useNavigate();
  const { t } = useTranslation();
  //实时获取用户信息
  const [userData, setUserData] = useState(null);
  const [balance, setBalance] = useState(0);
  const [usedQuota, setUsedQuota] = useState(0);
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        let res = await API.get(`/api/user/self`);
        const { success, data } = res.data;
        if (success) {
          setUserData(data);
          const quotaPerUnit = localStorage.getItem('quota_per_unit') || 500000;
          setBalance((data.quota / quotaPerUnit).toFixed(2));
          setUsedQuota((data.used_quota / quotaPerUnit).toFixed(2));
          setRequestCount(data.request_count);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  const getGroupLabel = (group) => {
    if (!group) return '未知';
    return group === 'default' ? '普通用户' : group;
  };
  return (
    <CardStyle>
      <CardContent sx={{ p: 2 }}>
        <List sx={{ p: 0, m: 0 }}>
          <ListItem alignItems="flex-start" disableGutters sx={{ p: 0 }}>
            <ListItemAvatar sx={{ mt: 0 }}>
              <Avatar
                variant="rounded"
                src="https://cdn-img-r2.czl.net/2024/03/26/6602ae7c2066b.webp"
                sx={{
                  ...theme.typography.commonAvatar,
                  ...theme.typography.largeAvatar,
                  color: theme.palette.primary.main,
                  border: 'none',
                  borderColor: theme.palette.primary.main,
                  background: '#cdd5df',
                  marginRight: '12px'
                }}
                onClick={() => navigate('/panel/profile')}
              ></Avatar>
            </ListItemAvatar>
            <ListItemText
              sx={{ mt: 0 }}
              primary={
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: theme.palette.primary[200],
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    // gap: 1  // 添加一些间距
                  }}
                >
                  <span>{userData ? userData.display_name : 'Loading...'}</span>
                  {userData && (
                    <Chip
                      label={getGroupLabel(userData.group)}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ height: '20px', fontSize: '0.75rem' }}
                    />
                  )}
                </Typography>


              }
              secondary={
                <Box component="span">
                  <Typography variant="caption" display="block" component="span">
                    {t('dashboard_index.balance')}: ${balance}
                  </Typography>
                  <Typography variant="caption" display="block" component="span">
                    {t('dashboard_index.used')}: ${usedQuota}
                  </Typography>
                  <Typography variant="caption" display="block" component="span">
                    {t('dashboard_index.calls')}: {requestCount}
                  </Typography>
                </Box>
              }
              secondaryTypographyProps={{ sx: { mt: 1 } }}  // 增加 secondary 文本的顶部边距
            />
          </ListItem>
          {/* 新增的在线客服列表项 */}
          <Button
            variant="contained"
            startIcon={<IconHeadset />}
            fullWidth
            sx={{
              mt: 2,
              backgroundColor: theme.palette.primary.light,
              color: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
              }
            }}
            onClick={() => window.open('https://work.weixin.qq.com/kfid/kfce787ac8bbad50026', '_blank')}
          >
            在线客服
          </Button>
        </List>
      </CardContent>
    </CardStyle>
  );
};

export default MenuCard;
