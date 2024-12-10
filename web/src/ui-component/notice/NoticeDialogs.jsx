import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import { Icon } from '@iconify/react';

import { useNotice } from './NoticeContext';

export const NoticeDialogs = () => {
  const { isOpen, closeNotice, notice } = useNotice();

  return (
    <Dialog aria-labelledby="customized-dialog-title" open={isOpen} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{
          margin: '0px',
          fontWeight: 700,
          lineHeight: '1.55556',
          padding: '24px',
          fontSize: '1.125rem'
        }}
        id="customized-dialog-title"
      >
        公告
      </DialogTitle>
      <IconButton
        aria-label="close"
        onClick={closeNotice}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500]
        }}
      >
        <Icon icon="solar:close-circle-bold" />
      </IconButton>
      <DialogContent dividers>
        <div dangerouslySetInnerHTML={{ __html: notice || '' }} />
      </DialogContent>
    </Dialog>
  );
};
