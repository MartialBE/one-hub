import PropTypes from 'prop-types';

import { useState } from 'react';
import { TableRow, TableCell, Button, Dialog, DialogActions, DialogContent, Tooltip } from '@mui/material';

import { timestamp2string, copy } from 'utils/common';
import Label from 'ui-component/Label';
import { STATUS_TYPE } from '../type/Type';
import CodeBlock from 'ui-component/CodeBlock';
import SunoMusic from './SunoMusic';

function renderType(types, type) {
  const typeOption = types[type];
  if (typeOption) {
    return (
      <Label variant="filled" color={typeOption.color}>
        {' '}
        {typeOption.text}{' '}
      </Label>
    );
  } else {
    return (
      <Label variant="filled" color="error">
        {' '}
        未知{' '}
      </Label>
    );
  }
}

function TruncatedText(text) {
  const truncatedText = text.length > 30 ? text.substring(0, 30) + '...' : text;

  return (
    <Tooltip
      placement="top"
      title={text}
      onClick={() => {
        copy(text, '');
      }}
    >
      <span>{truncatedText}</span>
    </Tooltip>
  );
}

export default function LogTableRow({ item, userIsAdmin }) {
  const [open, setOpen] = useState(false);
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  let request_time = 0;
  let request_time_str = '';
  if (item.finish_time > 0) {
    request_time = item.finish_time - item.submit_time;
    request_time_str = request_time.toFixed(2) + ' 秒';
  }

  return (
    <>
      <TableRow tabIndex={item.id}>
        <TableCell>{item.task_id}</TableCell>
        <TableCell>{timestamp2string(item.submit_time)}</TableCell>
        <TableCell>{timestamp2string(item.finish_time)}</TableCell>

        {userIsAdmin && <TableCell>{item.channel_id || ''}</TableCell>}
        {userIsAdmin && <TableCell>{item.user_id || ''}</TableCell>}

        <TableCell>
          <Label color="success"> {item.platform} </Label>
        </TableCell>

        <TableCell>
          <Label color="success"> {item.action} </Label>
        </TableCell>

        <TableCell>{request_time_str && <Label color={request_time > 60 ? 'error' : 'success'}> {request_time_str} </Label>}</TableCell>
        <TableCell>{item.progress}%</TableCell>

        <TableCell onClick={handleClickOpen}>{renderType(STATUS_TYPE, item.status)}</TableCell>
        <TableCell>{TruncatedText(item.fail_reason)}</TableCell>
      </TableRow>

      <Dialog open={open} onClose={handleClose} maxWidth={'md'} fullWidth>
        <DialogContent>{renderDialog(item)}</DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            关闭
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

LogTableRow.propTypes = {
  item: PropTypes.object,
  userIsAdmin: PropTypes.bool
};

function renderDialog(item) {
  if (!item.data) {
    return <p>无数据</p>;
  }

  if (item.platform == 'suno' && item.action == 'MUSIC') {
    return <SunoMusic items={item.data} />;
  }

  return <CodeBlock language="json" code={JSON.stringify(item.data, null, 2)} />;
}
