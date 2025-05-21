import { Grid, Box } from '@mui/material';
import { gridSpacing } from 'store/constant';

// Import components
import SystemLogs from './components/SystemLogs';

// Main SystemInfo Component
const SystemInfo = () => {
  return (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={gridSpacing}>
        {/* System Logs */}
        <Grid item xs={12}>
          <SystemLogs />
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemInfo;
