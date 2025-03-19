import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import { Icon } from '@iconify/react';
import { InputAdornment, OutlinedInput, Stack, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import LogType from '../type/LogType';
import { useTranslation } from 'react-i18next';
import 'dayjs/locale/zh-cn';

// ----------------------------------------------------------------------

export default function TableToolBar({ filterName, handleFilterName, userIsAdmin }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const grey500 = theme.palette.grey[500];

  return (
    <>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 3, sm: 2, md: 4 }} padding={'24px'} paddingBottom={'0px'}>
        <FormControl>
          <InputLabel htmlFor="channel-token_name-label">{t('tableToolBar.tokenName')}</InputLabel>
          <OutlinedInput
            id="token_name"
            name="token_name"
            sx={{
              minWidth: '100%'
            }}
            label={t('tableToolBar.tokenName')}
            value={filterName.token_name}
            onChange={handleFilterName}
            placeholder={t('tableToolBar.tokenName')}
            startAdornment={
              <InputAdornment position="start">
                <Icon icon="solar:key-bold-duotone" width="20" color={grey500} />
              </InputAdornment>
            }
          />
        </FormControl>
        <FormControl>
          <InputLabel htmlFor="channel-model_name-label">{t('tableToolBar.modelName')}</InputLabel>
          <OutlinedInput
            id="model_name"
            name="model_name"
            sx={{
              minWidth: '100%'
            }}
            label={t('tableToolBar.modelName')}
            value={filterName.model_name}
            onChange={handleFilterName}
            placeholder={t('tableToolBar.modelName')}
            startAdornment={
              <InputAdornment position="start">
                <Icon icon="solar:box-minimalistic-bold-duotone" width="20" color={grey500} />
              </InputAdornment>
            }
          />
        </FormControl>

        <FormControl>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={'zh-cn'}>
            <DateTimePicker
              label={t('tableToolBar.startTime')}
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
              label={t('tableToolBar.endTime')}
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
          <InputLabel htmlFor="channel-log_type-label">{t('tableToolBar.type')}</InputLabel>
          <Select
            id="channel-type-label"
            label={t('tableToolBar.type')}
            value={filterName.log_type}
            name="log_type"
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
            {Object.values(LogType).map((option) => {
              return (
                <MenuItem key={option.value} value={option.value}>
                  {option.text}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Stack>

      {userIsAdmin && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 3, sm: 2, md: 4 }} padding={'24px'}>
          <FormControl>
            <InputLabel htmlFor="channel-channel_id-label">{t('tableToolBar.channelId')}</InputLabel>
            <OutlinedInput
              id="channel_id"
              name="channel_id"
              sx={{
                minWidth: '100%'
              }}
              label={t('tableToolBar.channelId')}
              value={filterName.channel_id}
              onChange={handleFilterName}
              placeholder={t('tableToolBar.channelId')}
              startAdornment={
                <InputAdornment position="start">
                  <Icon icon="ph:open-ai-logo-duotone" width="20" color={grey500} />
                </InputAdornment>
              }
            />
          </FormControl>

          <FormControl>
            <InputLabel htmlFor="channel-username-label">{t('tableToolBar.username')}</InputLabel>
            <OutlinedInput
              id="username"
              name="username"
              sx={{
                minWidth: '100%'
              }}
              label={t('tableToolBar.username')}
              value={filterName.username}
              onChange={handleFilterName}
              placeholder={t('tableToolBar.username')}
              startAdornment={
                <InputAdornment position="start">
                  <Icon icon="solar:user-bold-duotone" width="20" color={grey500} />
                </InputAdornment>
              }
            />
          </FormControl>

          <FormControl>
            <InputLabel htmlFor="channel-source_ip-label">{t('tableToolBar.sourceIp')}</InputLabel>
            <OutlinedInput
              id="source_ip"
              name="source_ip"
              sx={{
                minWidth: '100%'
              }}
              label={t('tableToolBar.sourceIp')}
              value={filterName.source_ip}
              onChange={handleFilterName}
              placeholder={t('tableToolBar.sourceIp')}
              startAdornment={
                <InputAdornment position="start">
                  <Icon icon="solar:user-bold-duotone" width="20" color={grey500} />
                </InputAdornment>
              }
            />
          </FormControl>
        </Stack>
      )}
    </>
  );
}

TableToolBar.propTypes = {
  filterName: PropTypes.object,
  handleFilterName: PropTypes.func,
  userIsAdmin: PropTypes.bool
};
