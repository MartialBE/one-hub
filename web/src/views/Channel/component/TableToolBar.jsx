import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import { Icon } from '@iconify/react';
import { InputAdornment, OutlinedInput, Stack, FormControl, InputLabel, Select, MenuItem } from '@mui/material'; //
import { CHANNEL_OPTIONS } from 'constants/ChannelConstants';
import { useTranslation } from 'react-i18next';
// ----------------------------------------------------------------------

export default function TableToolBar({ filterName, handleFilterName, groupOptions, tags }) {
  const theme = useTheme();
  const grey500 = theme.palette.grey[500];
  const { t } = useTranslation();

  return (
    <>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 3, sm: 2, md: 4 }} padding={'24px'} paddingBottom={'0px'} sx={{ width: '100%', '& > *': { flex: 1 } }}>
        <FormControl>
          <InputLabel htmlFor="channel-name-label">{t('channel_index.channelName')}</InputLabel>
          <OutlinedInput
            id="name"
            name="name"
            sx={{
              minWidth: '100%'
            }}
            label={t('channel_index.channelName')}
            value={filterName.name}
            onChange={handleFilterName}
            placeholder={t('channel_index.channelName')}
            startAdornment={
              <InputAdornment position="start">
                <Icon icon="ph:open-ai-logo-duotone" width={20} height={20} color={grey500} />
              </InputAdornment>
            }
          />
        </FormControl>
        <FormControl>
          <InputLabel htmlFor="channel-models-label">{t('channel_index.modelName')}</InputLabel>
          <OutlinedInput
            id="models"
            name="models"
            sx={{
              minWidth: '100%'
            }}
            label={t('channel_index.modelName')}
            value={filterName.models}
            onChange={handleFilterName}
            placeholder={t('channel_index.modelName')}
            startAdornment={
              <InputAdornment position="start">
                <Icon icon="solar:box-minimalistic-bold-duotone" width={20} height={20} color={grey500} />
              </InputAdornment>
            }
          />
        </FormControl>
        <FormControl>
          <InputLabel htmlFor="channel-test_model-label">{t('channel_index.testModel')}</InputLabel>
          <OutlinedInput
            id="test_model"
            name="test_model"
            sx={{
              minWidth: '100%'
            }}
            label={t('channel_index.testModel')}
            value={filterName.test_model}
            onChange={handleFilterName}
            placeholder={t('channel_index.testModel')}
            startAdornment={
              <InputAdornment position="start">
                <Icon icon="solar:test-tube-bold-duotone" width={20} height={20} color={grey500} />
              </InputAdornment>
            }
          />
        </FormControl>
        <FormControl>
          <InputLabel htmlFor="channel-key-label">key</InputLabel>
          <OutlinedInput
            id="key"
            name="key"
            sx={{
              minWidth: '100%'
            }}
            label="key"
            value={filterName.key}
            onChange={handleFilterName}
            placeholder="key"
            startAdornment={
              <InputAdornment position="start">
                <Icon icon="solar:key-bold-duotone" width={20} height={20} color={grey500} />
              </InputAdornment>
            }
          />
        </FormControl>
        <FormControl>
          <InputLabel htmlFor="channel-other-label">{t('channel_index.otherParameters')}</InputLabel>
          <OutlinedInput
            id="other"
            name="other"
            sx={{
              minWidth: '100%'
            }}
            label={t('channel_index.otherParameters')}
            value={filterName.other}
            onChange={handleFilterName}
            placeholder={t('channel_index.otherParameters')}
            startAdornment={
              <InputAdornment position="start">
                <Icon icon="solar:settings-bold-duotone" width={20} height={20} color={grey500} />
              </InputAdornment>
            }
          />
        </FormControl>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 3, sm: 2, md: 4 }} padding={'24px'} sx={{ width: '100%', '& > *': { flex: 1 } }}>
        <FormControl>
          <InputLabel htmlFor="channel-type-label">{t('channel_index.channelType')}</InputLabel>
          <Select
            id="channel-type-label"
            label={t('channel_index.channelType')}
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
            <MenuItem key={0} value={0}>
              {t('channel_index.all')}
            </MenuItem>

            {Object.values(CHANNEL_OPTIONS).map((option) => {
              return (
                <MenuItem key={option.value} value={option.value}>
                  {option.text}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
        <FormControl>
          <InputLabel htmlFor="channel-status-label">{t('channel_index.status')}</InputLabel>
          <Select
            id="channel-status-label"
            label={t('channel_index.status')}
            value={filterName.status}
            name="status"
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
            <MenuItem key={0} value={0}>
              {t('channel_index.all')}
            </MenuItem>
            <MenuItem key={1} value={1}>
              {t('channel_index.enabled')}
            </MenuItem>
            <MenuItem key={2} value={2}>
              {t('channel_index.disabled')}
            </MenuItem>
            <MenuItem key={3} value={3}>
              {t('channel_index.speedTestDisabled')}
            </MenuItem>
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel htmlFor="channel-group-label">{t('channel_index.group')}</InputLabel>
          <Select
            id="channel-group-label"
            label={t('channel_index.group')}
            value={filterName.group}
            name="group"
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
            {groupOptions.map((option) => {
              return (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
        <FormControl>
          <InputLabel htmlFor="channel-filter_tag-label">{t('channel_index.filterTags')}</InputLabel>
          <Select
            id="channel-filter_tag-label"
            label={t('channel_index.filterTags')}
            value={filterName.filter_tag}
            name="filter_tag"
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
            <MenuItem key={0} value={0}>
              {t('channel_index.all')}
            </MenuItem>
            <MenuItem key={1} value={1}>
              {t('channel_index.filterTags')}
            </MenuItem>
            <MenuItem key={2} value={2}>
              {t('channel_index.onlyTags')}
            </MenuItem>
          </Select>
        </FormControl>
        <FormControl>
          <InputLabel htmlFor="channel-tag-label">{t('channel_index.tags')}</InputLabel>
          <Select
            id="channel-tag-label"
            label={t('channel_index.tags')}
            value={filterName.tag}
            name="tag"
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
            {tags.map((option) => {
              return (
                <MenuItem key={option.tag} value={option.tag}>
                  {option.tag}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Stack>
    </>
  );
}

TableToolBar.propTypes = {
  filterName: PropTypes.object,
  handleFilterName: PropTypes.func,
  groupOptions: PropTypes.array,
  tags: PropTypes.array
};
