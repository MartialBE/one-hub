import PropTypes from 'prop-types';
import React from 'react';
import { IconButton, TableCell, TableRow, Tooltip, Typography, Stack, Chip, Box, alpha, useTheme } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { ValueFormatter } from 'utils/common';

const PricesTableRow = ({ item, onEdit, onDelete, ownedby, unit = 'K' }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const models = item.models;

  // 处理渠道颜色
  const getChannelColor = () => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.info.main,
      theme.palette.warning.main
    ];
    // 根据channel_type确定颜色
    return colors[(item.channel_type - 1) % colors.length];
  };

  const channelColor = getChannelColor();

  // 根据计费类型获取对应颜色
  const getTypeColor = () => {
    if (item.type === 'tokens') {
      return {
        bg: alpha(theme.palette.primary.main, 0.1),
        text: theme.palette.primary.main,
        border: alpha(theme.palette.primary.main, 0.3)
      };
    } else {
      return {
        bg: alpha(theme.palette.warning.main, 0.1),
        text: theme.palette.warning.main,
        border: alpha(theme.palette.warning.main, 0.3)
      };
    }
  };

  const typeColor = getTypeColor();

  // 获取渠道名称
  const getChannelName = (channelType) => {
    const channel = ownedby.find((item) => item.value === channelType);
    return channel?.label || 'unknown';
  };

  // 格式化价格
  const formatPrice = (value) => {
    if (value === 0) {
      return 'Free';
    }

    // 确定是否使用M单位和单位后缀
    let isM = unit === 'M';
    let unitLabel = '';

    if (item.type === 'tokens') {
      unitLabel = `/ 1${unit}`;
    } else {
      isM = false;
    }

    return ValueFormatter(value, true, isM) + unitLabel;
  };

  // 判断是否有extra_ratios
  const hasExtraRatios = item.extra_ratios && Object.keys(item.extra_ratios).length > 0;

  // 为extra_ratios中的key获取更易读的名称
  const getReadableRatioName = (key) => {
    const ratioNames = {
      cached_tokens: t('modelpricePage.cached_tokens'),
      cached_write_tokens: t('modelpricePage.cached_write_tokens'),
      cached_read_tokens: t('modelpricePage.cached_read_tokens'),
      input_audio_tokens: t('modelpricePage.input_audio_tokens'),
      output_audio_tokens: t('modelpricePage.output_audio_tokens'),
      reasoning_tokens: t('modelpricePage.reasoning_tokens'),
      input_text_tokens: t('modelpricePage.input_text_tokens'),
      output_text_tokens: t('modelpricePage.output_text_tokens'),
      input_image_tokens: t('modelpricePage.input_image_tokens')
    };

    return ratioNames[key] || key;
  };

  const handleEdit = () => {
    onEdit && onEdit(item);
  };

  const handleDelete = () => {
    onDelete && onDelete(item);
  };

  return (
    <TableRow
      sx={{
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        position: 'relative',
        '&:hover': {
          bgcolor: alpha(theme.palette.primary.main, 0.05)
        },
        '&:hover .action-buttons': {
          opacity: 1
        },
        transition: 'background-color 0.15s ease'
      }}
    >
      {/* 类型与锁定状态 */}
      <TableCell width="20%" align="left" sx={{ pl: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Chip
              label={item.type === 'tokens' ? t('modelpricePage.tokens') : t('modelpricePage.times')}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.72rem',
                fontWeight: 500,
                borderRadius: '4px',
                bgcolor: typeColor.bg,
                color: typeColor.text,
                border: `1px solid ${typeColor.border}`,
                minWidth: 60
              }}
            />

            {item.locked && (
              <Tooltip title={t('pricing_edit.locked')} arrow>
                <LockIcon
                  fontSize="small"
                  sx={{
                    color: theme.palette.warning.main,
                    fontSize: '1rem'
                  }}
                />
              </Tooltip>
            )}
          </Box>

          <Chip
            label={getChannelName(item.channel_type)}
            size="small"
            sx={{
              height: 22,
              fontSize: '0.72rem',
              fontWeight: 500,
              borderRadius: '4px',
              bgcolor: alpha(channelColor, 0.1),
              color: channelColor,
              border: `1px solid ${alpha(channelColor, 0.2)}`,
              mr: 'auto'
            }}
          />
        </Box>
      </TableCell>

      {/* 价格区域 */}
      <TableCell width="15%" align="center">
        <Stack spacing={0.75}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.75,
              p: '2px 4px',
              borderRadius: '2px',
              transition: 'background-color 0.2s',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.05)
              }
            }}
          >
            <Icon icon="mdi:arrow-down-thin" width={14} style={{ color: theme.palette.primary.main }} />
            <Typography variant="body2" fontWeight={600} title={t('modelpricePage.input')}>
              {formatPrice(item.input)}
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.75,
              p: '2px 4px',
              borderRadius: '2px',
              transition: 'background-color 0.2s',
              '&:hover': {
                bgcolor: alpha(theme.palette.secondary.main, 0.05)
              }
            }}
          >
            <Icon icon="mdi:arrow-up-thin" width={14} style={{ color: theme.palette.secondary.main }} />
            <Typography variant="body2" fontWeight={600} title={t('modelpricePage.output')}>
              {formatPrice(item.output)}
            </Typography>
          </Box>
        </Stack>
      </TableCell>

      {/* 可用模型 */}
      <TableCell width="30%" sx={{ pl: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, mt: -0.5 }}>
            <Chip
              label={models.length}
              size="small"
              sx={{
                height: 18,
                minWidth: 26,
                fontSize: '0.68rem',
                fontWeight: 600,
                borderRadius: '3px',
                bgcolor: alpha(theme.palette.info.main, 0.1),
                color: theme.palette.info.main,
                '& .MuiChip-label': {
                  px: 0.5
                }
              }}
            />
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px 6px'
            }}
          >
            {models.map((model) => (
              <Chip
                key={model}
                label={model}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.68rem',
                  borderRadius: '3px',
                  bgcolor:
                    theme.palette.mode === 'dark' ? alpha(theme.palette.primary.dark, 0.15) : alpha(theme.palette.primary.light, 0.15),
                  color: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.light, 0.9) : theme.palette.primary.main,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                  '& .MuiChip-label': {
                    px: 0.8
                  }
                }}
              />
            ))}
          </Box>
        </Box>
      </TableCell>

      {/* 扩展价格 */}
      <TableCell width="25%" sx={{ pl: 2 }}>
        {hasExtraRatios ? (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px 6px'
            }}
          >
            {Object.entries(item.extra_ratios || {}).map(([key, value]) => (
              <Chip
                key={key}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.68rem',
                  borderRadius: '3px',
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`
                }}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.text.secondary,
                        fontSize: '0.68rem'
                      }}
                    >
                      {getReadableRatioName(key)}:
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: theme.palette.primary.main,
                        fontSize: '0.68rem'
                      }}
                    >
                      {value}
                    </Typography>
                  </Box>
                }
              />
            ))}
          </Box>
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            {t('modelpricePage.noExtraRatios')}
          </Typography>
        )}
      </TableCell>

      {/* 操作按钮 */}
      <TableCell width="10%" align="right" sx={{ pr: 2 }}>
        <Stack
          direction="row"
          spacing={0.5}
          justifyContent="flex-end"
          className="action-buttons"
          sx={{
            opacity: { xs: 1, sm: 0.4 },
            transition: 'opacity 0.2s ease'
          }}
        >
          <Tooltip title={t('common.edit')} arrow>
            <IconButton
              size="small"
              onClick={handleEdit}
              sx={{
                color: theme.palette.primary.main,
                transition: 'transform 0.15s ease, background-color 0.15s',
                '&:hover': {
                  transform: 'scale(1.05)',
                  bgcolor: alpha(theme.palette.primary.main, 0.1)
                }
              }}
            >
              <Icon icon="mdi:pencil" width={18} />
            </IconButton>
          </Tooltip>

          <Tooltip title={t('common.delete')} arrow>
            <IconButton
              size="small"
              onClick={handleDelete}
              sx={{
                color: theme.palette.error.main,
                transition: 'transform 0.15s ease, background-color 0.15s',
                '&:hover': {
                  transform: 'scale(1.05)',
                  bgcolor: alpha(theme.palette.error.main, 0.1)
                }
              }}
            >
              <Icon icon="mdi:delete" width={18} />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
};

PricesTableRow.propTypes = {
  item: PropTypes.object,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  ownedby: PropTypes.array,
  unit: PropTypes.string
};

export default PricesTableRow;
