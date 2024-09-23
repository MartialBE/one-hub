import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import { IconBroadcast, IconCalendarEvent } from '@tabler/icons-react';
import { InputAdornment, OutlinedInput, Stack, FormControl, InputLabel } from '@mui/material';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
// ----------------------------------------------------------------------
import { useTranslation } from 'react-i18next';

export default function TableToolBar({ filterName, handleFilterName, userIsAdmin }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const grey500 = theme.palette.grey[500];

  return (
    <>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 3, sm: 2, md: 4 }} padding={'24px'} paddingBottom={'0px'}>
        {userIsAdmin && (
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
              placeholder={t('tableToolBar.channelIdPlaceholder')}
              startAdornment={
                <InputAdornment position="start">
                  <IconBroadcast stroke={1.5} size="20px" color={grey500} />
                </InputAdornment>
              }
            />
          </FormControl>
        )}
        <FormControl>
          <InputLabel htmlFor="channel-mj_id-label">{t('tableToolBar.taskId')}</InputLabel>
          <OutlinedInput
            id="mj_id"
            name="mj_id"
            sx={{
              minWidth: '100%'
            }}
            label={t('tableToolBar.taskId')}
            value={filterName.mj_id}
            onChange={handleFilterName}
            placeholder={t('tableToolBar.taskIdPlaceholder')}
            startAdornment={
              <InputAdornment position="start">
                <IconCalendarEvent stroke={1.5} size="20px" color={grey500} />
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
              value={filterName.start_timestamp === 0 ? null : dayjs.unix(filterName.start_timestamp / 1000)}
              onChange={(value) => {
                if (value === null) {
                  handleFilterName({ target: { name: 'start_timestamp', value: 0 } });
                  return;
                }
                handleFilterName({ target: { name: 'start_timestamp', value: value.unix() * 1000 } });
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
              value={filterName.end_timestamp === 0 ? null : dayjs.unix(filterName.end_timestamp / 1000)}
              onChange={(value) => {
                if (value === null) {
                  handleFilterName({ target: { name: 'end_timestamp', value: 0 } });
                  return;
                }
                handleFilterName({ target: { name: 'end_timestamp', value: value.unix() * 1000 } });
              }}
              slotProps={{
                actionBar: {
                  actions: ['clear', 'today', 'accept']
                }
              }}
            />
          </LocalizationProvider>
        </FormControl>
      </Stack>
    </>
  );
}

TableToolBar.propTypes = {
  filterName: PropTypes.object,
  handleFilterName: PropTypes.func,
  userIsAdmin: PropTypes.bool
};
