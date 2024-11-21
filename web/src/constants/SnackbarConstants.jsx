import { closeSnackbar } from 'notistack';
import { IconButton } from '@mui/material';
import { Icon } from '@iconify/react';

const action = (snackbarId) => (
  <>
    <IconButton
      onClick={() => {
        closeSnackbar(snackbarId);
      }}
    >
      <Icon icon="solar:close-circle-bold" width="20" />
    </IconButton>
  </>
);

export const snackbarConstants = {
  Common: {
    ERROR: {
      variant: 'error',
      autoHideDuration: 5000,
      preventDuplicate: true,
      action
    },
    WARNING: {
      variant: 'warning',
      autoHideDuration: 10000,
      preventDuplicate: true,
      action
    },
    SUCCESS: {
      variant: 'success',
      autoHideDuration: 1500,
      preventDuplicate: true,
      action
    },
    INFO: {
      variant: 'info',
      autoHideDuration: 3000,
      preventDuplicate: true,
      action
    },
    NOTICE: {
      variant: 'info',
      autoHideDuration: 20000,
      preventDuplicate: true,
      action
    },
    COPY: {
      variant: 'copy',
      persist: true,
      preventDuplicate: true,
      allowDownload: true,
      action
    }
  },
  Mobile: {
    anchorOrigin: { vertical: 'bottom', horizontal: 'center' }
  }
};
