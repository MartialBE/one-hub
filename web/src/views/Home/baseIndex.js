import { Box, Typography,  Container, Stack } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useTranslation } from 'react-i18next';

const BaseIndex = () => {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 136px)',
        backgroundImage: 'linear-gradient(to right, #ff9966, #ff5e62)',
        color: 'white',
        p: 4
      }}
    >
      <Container maxWidth="lg">
        <Grid container columns={12} wrap="nowrap" alignItems="center" sx={{ minHeight: 'calc(100vh - 230px)' }}>
          <Grid md={7} lg={6}>
            <Stack spacing={3}>
              <Typography variant="h1" sx={{ fontSize: '4rem', color: '#fff', lineHeight: 1.5 }}>
                CZLOapi
              </Typography>
              <Typography variant="h4" sx={{ fontSize: '1.5rem', color: '#fff', lineHeight: 1.5 }}>
                {t('description')}
              </Typography>

            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default BaseIndex;
