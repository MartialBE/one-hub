import PropTypes from 'prop-types';
// import { useState } from 'react';

import { TableRow, TableCell, Button } from '@mui/material';
import { renderNumber, calculateQuota } from 'utils/common';

import { useTranslation } from 'react-i18next';

export default function InvoiceTableRow({ item, manageInvoice }) {
  const { t } = useTranslation();

  return (
    <>
      <TableRow tabIndex={item.id}>
        <TableCell>{item.date ? item.date.substring(0, 7) : ''}</TableCell>
        <TableCell>${calculateQuota(item.quota,6)}</TableCell>
        <TableCell>
          {renderNumber(item.prompt_tokens)} / {renderNumber(item.completion_tokens)}
        </TableCell>
        <TableCell>{item.request_count}</TableCell>
        <TableCell>{(item.request_time / 1000).toFixed(3)}s</TableCell>
        <TableCell>
          <Button 
            variant="contained" 
            color="primary" 
            size="small" 
            onClick={() => manageInvoice(item.date)}
          >
            {t('invoice_index.viewInvoice')}
          </Button>
        </TableCell>
      </TableRow>
    </>
  );
}

InvoiceTableRow.propTypes = {
  item: PropTypes.object,
  manageInvoice: PropTypes.func
};
