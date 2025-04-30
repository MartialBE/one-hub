import PropTypes from 'prop-types';
import { useTheme, alpha } from '@mui/material/styles';
import { useState, useMemo } from 'react';
import { Box, Typography, FormControl, InputLabel, OutlinedInput, Select, MenuItem, IconButton, Stack, Tooltip } from '@mui/material';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { extraRatiosConfig } from './config';

export const ExtraRatiosSelector = ({ value = {}, onChange }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [selectedRatio, setSelectedRatio] = useState('');

  // 过滤掉已经添加的配置项
  const availableRatios = useMemo(() => {
    return extraRatiosConfig.filter((config) => value[config.key] === undefined);
  }, [value]);

  // 已添加的配置项
  const addedRatios = useMemo(() => {
    return extraRatiosConfig.filter((config) => value[config.key] !== undefined);
  }, [value]);

  // 添加新的扩展倍率，初始值为与基础价格相同
  const handleAddRatio = () => {
    if (selectedRatio && !value[selectedRatio]) {
      const newValue = { ...value, [selectedRatio]: 0 };
      onChange(newValue);
      setSelectedRatio('');
    }
  };

  // 移除扩展倍率
  const handleRemoveRatio = (key) => {
    const newValue = { ...value };
    delete newValue[key];
    onChange(newValue);
  };

  // 更新扩展倍率的值
  const handleChangeRatioValue = (key, newValue) => {
    onChange({ ...value, [key]: Number(newValue) });
  };

  // 获取配置项的名称
  const getRatioNameByKey = (key) => {
    const config = extraRatiosConfig.find((item) => item.key === key);
    return config ? config.name : key;
  };

  // 获取图标
  const getIcon = (isPrompt) => {
    return isPrompt ? 'material-symbols:input-rounded' : 'material-symbols:output-rounded';
  };

  // 获取图标颜色
  const getIconColor = (isPrompt) => {
    return theme.palette.mode === 'dark'
      ? isPrompt
        ? theme.palette.info.light
        : theme.palette.success.light
      : isPrompt
        ? theme.palette.info.main
        : theme.palette.success.main;
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography
        variant="body1"
        gutterBottom
        sx={{
          fontWeight: 500,
          mb: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 0.8
        }}
      >
        <Icon icon="tabler:multiplier-1-5x" width={18} height={18} color={theme.palette.primary.main} />
        {t('pricing_edit.extraRatios')}
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
        <FormControl fullWidth>
          <InputLabel>{t('pricing_edit.selectExtraRatio')}</InputLabel>
          <Select
            value={selectedRatio}
            onChange={(e) => setSelectedRatio(e.target.value)}
            input={<OutlinedInput label={t('pricing_edit.selectExtraRatio')} />}
            disabled={availableRatios.length === 0}
          >
            {availableRatios.length === 0 ? (
              <MenuItem disabled>
                <Typography variant="body2" color="textSecondary">
                  {t('pricing_edit.noAvailableRatios')}
                </Typography>
              </MenuItem>
            ) : (
              availableRatios.map((option) => (
                <MenuItem key={option.key} value={option.key}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Icon icon={getIcon(option.isPrompt)} color={getIconColor(option.isPrompt)} width={16} />
                    <Typography variant="body2">{option.name}</Typography>
                  </Stack>
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
        <IconButton
          onClick={handleAddRatio}
          disabled={!selectedRatio}
          sx={{
            bgcolor: theme.palette.primary.main,
            color: '#fff',
            borderRadius: 1,
            height: 40,
            width: { xs: '100%', sm: 40 },
            '&:hover': {
              bgcolor: theme.palette.primary.dark
            },
            '&.Mui-disabled': {
              bgcolor: alpha(theme.palette.action.disabled, 0.12),
              color: theme.palette.action.disabled
            }
          }}
        >
          <Icon icon="ic:baseline-add" width={20} />
        </IconButton>
      </Stack>

      {addedRatios.length > 0 ? (
        <Stack spacing={1}>
          {addedRatios.map((config) => (
            <Box
              key={config.key}
              sx={{
                p: 1,
                borderRadius: 1,
                border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.4) : theme.palette.background.paper
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Icon
                  icon={getIcon(config.isPrompt)}
                  color={getIconColor(config.isPrompt)}
                  width={20}
                  height={20}
                  style={{ marginLeft: 4 }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    fontSize: '0.85rem',
                    flex: 1
                  }}
                >
                  {getRatioNameByKey(config.key)}
                </Typography>
                <FormControl size="small" sx={{ width: '40%', minWidth: 120 }}>
                  <OutlinedInput
                    type="number"
                    value={value[config.key]}
                    inputProps={{
                      step: '0.01',
                      min: '0'
                    }}
                    // startAdornment={
                    //   <InputAdornment position="start" sx={{ color: theme.palette.text.secondary }}>
                    //     {handleStartAdornment()}
                    //   </InputAdornment>
                    // }
                    onChange={(e) => handleChangeRatioValue(config.key, parseFloat(e.target.value) || 0)}
                    sx={{
                      height: 36,
                      '& .MuiOutlinedInput-input': {
                        py: 0.5
                      }
                    }}
                  />
                </FormControl>
                <Tooltip title={t('common.delete')}>
                  <IconButton
                    onClick={() => handleRemoveRatio(config.key)}
                    size="small"
                    color="error"
                    sx={{
                      width: 30,
                      height: 30
                    }}
                  >
                    <Icon icon="ic:baseline-delete" width={18} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
          ))}
        </Stack>
      ) : (
        <Box
          sx={{
            p: 2,
            border: `1px dashed ${theme.palette.divider}`,
            borderRadius: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: theme.palette.text.secondary,
            bgcolor:
              theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.3) : alpha(theme.palette.background.default, 0.6)
          }}
        >
          <Typography variant="body2" color="inherit" align="center">
            {t('pricing_edit.noExtraRatios')}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

ExtraRatiosSelector.propTypes = {
  value: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  handleStartAdornment: PropTypes.func.isRequired
};
