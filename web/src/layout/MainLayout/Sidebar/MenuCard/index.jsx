import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

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
  Chip,
  Box,
  LinearProgress
} from '@mui/material';
import User1 from 'assets/images/users/user-round.svg';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API } from 'utils/api';

// assets
// import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';

// styles
// const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
//   height: 10,
//   borderRadius: 30,
//   [`&.${linearProgressClasses.colorPrimary}`]: {
//     backgroundColor: '#fff'
//   },
//   [`& .${linearProgressClasses.bar}`]: {
//     borderRadius: 5,
//     backgroundColor: theme.palette.primary.main
//   }
// }));

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

// ==============================|| PROGRESS BAR WITH LABEL ||============================== //

// function LinearProgressWithLabel({ value, ...others }) {
//   const theme = useTheme();

//   return (
//     <Grid container direction="column" spacing={1} sx={{ mt: 1.5 }}>
//       <Grid item>
//         <Grid container justifyContent="space-between">
//           <Grid item>
//             <Typography variant="h6" sx={{ color: theme.palette.primary[800] }}>
//               Progress
//             </Typography>
//           </Grid>
//           <Grid item>
//             <Typography variant="h6" color="inherit">{`${Math.round(value)}%`}</Typography>
//           </Grid>
//         </Grid>
//       </Grid>
//       <Grid item>
//         <BorderLinearProgress variant="determinate" value={value} {...others} />
//       </Grid>
//     </Grid>
//   );
// }

// LinearProgressWithLabel.propTypes = {
//   value: PropTypes.number
// };

// ==============================|| SIDEBAR MENU Card ||============================== //


const MenuCard = () => {
  const theme = useTheme();
  const account = useSelector((state) => state.account);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [userData, setUserData] = useState(null);
  const [balance, setBalance] = useState(0);
  const [usedQuota, setUsedQuota] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [userGroupMap, setUserGroupMap] = useState({});
  const [selectedGroup, setSelectedGroup] = useState('');

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
    const fetchUserGroupMap = async () => {
      try {
        const res = await API.get('/api/user_group_map');
        const { success, message, data } = res.data;
        if (success) {
          setUserGroupMap(data);
          setSelectedGroup(Object.keys(data)[0]); // 默认选择第一个分组
        } else {
          showError(message);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchUserGroupMap();
  }, []);
  
  const getGroupLabel = (group) => {
    if (!group) return '未知';
    return group === 'default' ? '免费用户' : group;
  };
  
  const totalQuota = parseFloat(balance) + parseFloat(usedQuota);
  const progressValue = (parseFloat(usedQuota) / totalQuota) * 100;

  return (
    <CardStyle>
      <CardContent sx={{ p: 2, pb: '8px !important' }}>
        <List sx={{ p: 0, m: 0 }}>
          <ListItem alignItems="flex-start" disableGutters sx={{ p: 0 }}>
            <ListItemAvatar sx={{ mt: 0 }}>
              <Avatar
                variant="rounded"
                src={account.user?.avatar_url || User1}
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
                    {userData && userGroupMap && selectedGroup && userGroupMap[selectedGroup] && (
                      <Chip
                      label={`${userGroupMap[selectedGroup].name} ❤️ rpm: ${userGroupMap[selectedGroup].api_rate}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ 
                        height: '1.2rem', 
                        fontSize: '0.75rem',
                        borderRadius: '4px',
                      }}
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
              {`${t('dashboard_index.used')}:💲${usedQuota} | ${Math.round(progressValue)}% `}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </CardStyle>
  );
};

export default MenuCard;
