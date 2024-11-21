import React, { useState, useEffect } from 'react';

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
  Box,
  LinearProgress
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

// const ProgressLabel = styled(Typography)(({ theme }) => ({
//   position: 'absolute',
//   left: '50%',
//   top: '50%',
//   transform: 'translate(-50%, -50%)',
//   color: theme.palette.primary.contrastText,
//   fontWeight: 'bold',
//   fontSize: '0.75rem'
// }));

// ==============================|| SIDEBAR MENU Card ||============================== //

const MenuCard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();
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
    return group === 'default' ? '免费用户' : group;
  };

  const totalQuota = parseFloat(balance) + parseFloat(usedQuota);
  const progressValue = (parseFloat(usedQuota) / totalQuota) * 100;

  return (
    <CardStyle>
      <CardContent sx={{ p: 2 }}>
        <List sx={{ p: 0, m: 0 }}>
          <ListItem alignItems="flex-start" disableGutters sx={{ p: 0 }}>
            <ListItemAvatar sx={{ mt: 0 }}>
              <Avatar
                variant="rounded"
                src="https://webp-sh.czl.net/r2/2024/03/26/6602ae7c2066b.webp"
                sx={{
                  ...theme.typography.commonAvatar,
                  ...theme.typography.largeAvatar,
                  color: theme.palette.primary.main,
                  border: 'none',
                  borderColor: theme.palette.primary.main,
                  background: '#cdd5df',
                  marginRight: '12px',
                  cursor: 'pointer'
                }}
                onClick={() => navigate('/panel/profile')}
              />
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
                    alignItems: 'flex-start'
                  }}
                >
                  <span>{userData ? userData.display_name : 'Loading...'}</span>
                  {userData && (
                    <Chip
                      label={getGroupLabel(userData.group)}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ height: '15px', fontSize: '0.75rem' }}
                    />
                  )}
                </Typography>
              }
            />
          </ListItem>
        </List>
        <Box sx={{ mt: 2, mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, fontSize: '0.5rem' }}>
            <Typography variant="body2" color="textSecondary" sx={{ flexGrow: 1 }}>
              {t('sidebar.remainingBalance')}: ${balance}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {t('dashboard_index.calls')}: {requestCount}
            </Typography>
          </Box>
          <Box sx={{ position: 'relative' }}>
            <LinearProgress
              variant="determinate"
              value={progressValue}
              sx={{
                height: 20,
                borderRadius: 5,
                bgcolor: theme.palette.background.default,
                '& .MuiLinearProgress-bar': {
                  borderRadius: 5,
                  bgcolor: theme.palette.success.dark
                }
              }}
            />
            <Typography
              variant="caption"
              component="div"
              color="textSecondary"
              sx={{
                position: 'absolute',
                right: theme.spacing(1),
                top: '50%',
                transform: 'translateY(-50%)'
              }}
            >
              {`${t('dashboard_index.used')}: $${usedQuota} / ${Math.round(progressValue)}% (RPM:${userGroup?.[users.group]?.api_rate || 0})`}
            </Typography>
          </Box>
        </Box>
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
              color: theme.palette.primary.contrastText
            }
          }}
          onClick={() => window.open('https://work.weixin.qq.com/kfid/kfce787ac8bbad50026', '_blank')}
        >
          在线客服
        </Button>
      </CardContent>
    </CardStyle>
  );
};

export default MenuCard;
