// import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

// material-ui
import { styled, useTheme } from '@mui/material/styles';
import {
  Avatar,
  Card,
  CardContent,
  // Grid,
  // LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography
  // linearProgressClasses
} from '@mui/material';
import User1 from 'assets/images/users/user-round.svg';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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
        <Button
          variant="contained"
          startIcon={<IconHeadset />}
          fullWidth
          sx={{
            mt: 2,
            //颜色适配暗色
            background: '#13151A',
            color: theme.palette.primary.contrastText,
            '&:hover': {
              backgroundColor: '#1C1E23',
              color: '#1CE3EA'
            }
          }}
          onClick={() => window.open('https://work.weixin.qq.com/kfid/kfce787ac8bbad50026', '_blank')}
        >
          微信客服
        </Button>
      </CardContent>
    </CardStyle>
  );
};

export default MenuCard;
