import PropTypes from 'prop-types';
import { OutlinedInput, Stack, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { StatusType } from './OrderTableRow';
import { useTranslation } from 'react-i18next';
require('dayjs/locale/zh-cn');
// ----------------------------------------------------------------------

export default function OrderTableToolBar({ filterName, handleFilterName }) {
  const { t } = useTranslation();

  return (
    <>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 3, sm: 2, md: 4 }} padding={'24px'} paddingBottom={'0px'}>
        <FormControl>
          <InputLabel htmlFor="channel-gateway_id-label">{t('orderlogPage.gatewayIdLabel')}</InputLabel>
          <OutlinedInput
            id="gateway_id"
            name="gateway_id"
            sx={{ minWidth: '100%' }}
            label={t('orderlogPage.gatewayIdLabel')}
            value={filterName.gateway_id}
            onChange={handleFilterName}
            placeholder={t('orderlogPage.placeholder.gatewayId')}
          />
        </FormControl>
        <FormControl>
          <InputLabel htmlFor="channel-user_id-label">{t('orderlogPage.userIdLabel')}</InputLabel>
          <OutlinedInput
            id="user_id"
            name="user_id"
            sx={{ minWidth: '100%' }}
            label={t('orderlogPage.userIdLabel')}
            value={filterName.user_id}
            onChange={handleFilterName}
            placeholder={t('orderlogPage.placeholder.userId')}
          />
        </FormControl>
        <FormControl>
          <InputLabel htmlFor="channel-trade_no-label">{t('orderlogPage.tradeNoLabel')}</InputLabel>
          <OutlinedInput
            id="trade_no"
            name="trade_no"
            sx={{ minWidth: '100%' }}
            label={t('orderlogPage.tradeNoLabel')}
            value={filterName.trade_no}
            onChange={handleFilterName}
            placeholder={t('orderlogPage.placeholder.tradeNo')}
          />
        </FormControl>
        <FormControl>
          <InputLabel htmlFor="channel-gateway_no-label">{t('orderlogPage.gatewayNoLabel')}</InputLabel>
          <OutlinedInput
            id="gateway_no"
            name="gateway_no"
            sx={{ minWidth: '100%' }}
            label={t('orderlogPage.gatewayNoLabel')}
            value={filterName.gateway_no}
            onChange={handleFilterName}
            placeholder={t('orderlogPage.placeholder.gatewayNo')}
          />
        </FormControl>

        <FormControl>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={'zh-cn'}>
            <DateTimePicker
              label={t('orderlogPage.startTimeLabel')}
              ampm={false}
              name="start_timestamp"
              value={filterName.start_timestamp === 0 ? null : dayjs.unix(filterName.start_timestamp)}
              onChange={(value) => {
                if (value === null) {
                  handleFilterName({ target: { name: 'start_timestamp', value: 0 } });
                  return;
                }
                handleFilterName({ target: { name: 'start_timestamp', value: value.unix() } });
              }}
              slotProps={{
                actionBar: {
                  actions: ['clear', 'today', 'accept']
                }
              }}
            />
          </LocalizationProvider>
        </FormControl>

        <FormControl>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={'zh-cn'}>
            <DateTimePicker
              label={t('orderlogPage.endTimeLabel')}
              name="end_timestamp"
              ampm={false}
              value={filterName.end_timestamp === 0 ? null : dayjs.unix(filterName.end_timestamp)}
              onChange={(value) => {
                if (value === null) {
                  handleFilterName({ target: { name: 'end_timestamp', value: 0 } });
                  return;
                }
                handleFilterName({ target: { name: 'end_timestamp', value: value.unix() } });
              }}
              slotProps={{
                actionBar: {
                  actions: ['clear', 'today', 'accept']
                }
              }}
            />
          </LocalizationProvider>
        </FormControl>
        <FormControl sx={{ minWidth: '22%' }}>
          <InputLabel htmlFor="channel-status-label">{t('orderlogPage.statusLabel')}</InputLabel>
          <Select
            id="channel-type-label"
            label={t('orderlogPage.statusLabel')}
            value={filterName.status}
            name="status"
            onChange={handleFilterName}
            sx={{ minWidth: '100%' }}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 200
                }
              }
            }}
          >
            {Object.values(StatusType).map((option) => {
              return (
                <MenuItem key={option.value} value={option.value}>
                  {t(`orderlogPage.statusOptions.${option.key}`)}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Stack>
    </>
  );
}

OrderTableToolBar.propTypes = {
  filterName: PropTypes.object,
  handleFilterName: PropTypes.func
};
