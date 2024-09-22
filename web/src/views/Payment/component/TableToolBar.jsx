import PropTypes from 'prop-types';
import { OutlinedInput, Stack, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { PaymentType } from '../type/Config';
import 'dayjs/locale/zh-cn';
import { useTranslation } from 'react-i18next';
// ----------------------------------------------------------------------

export default function TableToolBar({ filterName, handleFilterName }) {
  const { t } = useTranslation();
  return (
    <>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 3, sm: 2, md: 4 }} padding={'24px'} paddingBottom={'0px'}>
        <FormControl>
          <InputLabel htmlFor="channel-name-label">{t('paymentGatewayPage.tableHeaders.name')}</InputLabel>
          <OutlinedInput
            id="name"
            name="name"
            sx={{
              minWidth: '100%'
            }}
            label={t('paymentGatewayPage.tableHeaders.name')}
            value={filterName.name}
            onChange={handleFilterName}
            placeholder={t('paymentGatewayPage.tableHeaders.name')}
          />
        </FormControl>
        <FormControl>
          <InputLabel htmlFor="channel-uuid-label">UUID</InputLabel>
          <OutlinedInput
            id="uuid"
            name="uuid"
            sx={{
              minWidth: '100%'
            }}
            label={t('channel_index.modelName')}
            value={filterName.uuid}
            onChange={handleFilterName}
            placeholder="UUID"
          />
        </FormControl>
        <FormControl sx={{ minWidth: '22%' }}>
          <InputLabel htmlFor="channel-type-label">{t('paymentGatewayPage.tableHeaders.type')}</InputLabel>
          <Select
            id="channel-type-label"
            label={t('paymentGatewayPage.tableHeaders.type')}
            value={filterName.type}
            name="type"
            onChange={handleFilterName}
            sx={{
              minWidth: '100%'
            }}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 200
                }
              }
            }}
          >
            {Object.entries(PaymentType).map(([value, text]) => (
              <MenuItem key={value} value={value}>
                {text}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </>
  );
}

TableToolBar.propTypes = {
  filterName: PropTypes.object,
  handleFilterName: PropTypes.func
};
