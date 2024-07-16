import { Stack, Alert } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import TopupCard from './component/TopupCard';
import InviteCard from './component/InviteCard';
import { useTranslation } from 'react-i18next';

const Topup = () => {
  const { t } = useTranslation();

  return (
    <Grid container spacing={2}>
      <Grid xs={12}>
        <Alert severity="warning">{t('topupPage.alertMessage')}</Alert>
      </Grid>
      <Grid xs={12} md={6} lg={8}>
        <Stack spacing={2}>
          <TopupCard />
        </Stack>
      </Grid>
      <Grid xs={12} md={6} lg={4}>
        <InviteCard />
      </Grid>
    </Grid>
  );
};

export default Topup;
