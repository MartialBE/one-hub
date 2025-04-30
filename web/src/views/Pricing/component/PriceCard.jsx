import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { Box, Typography, Chip, IconButton, alpha, useTheme, Tooltip, TableRow, TableCell, Stack } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { ValueFormatter } from 'utils/common';

const PriceCard = ({ price, onEdit, onDelete, ownedby, unit = 'K' }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  // 获取channel_type对应的名称
  const getChannelTypeName = (type) => {
    const channel = ownedby.find((item) => item.value === type);
    return channel ? channel.label : t('pricing_edit.unknown');
  };

  const typeLabel = useMemo(() => {
    return price.type === 'tokens' ? t('modelpricePage.tokens') : t('modelpricePage.times');
  }, [price.type, t]);

  // 判断是否有extra_ratios
  const hasExtraRatios = price.extra_ratios && Object.keys(price.extra_ratios).length > 0;

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
    onEdit(price);
  };

  const handleDelete = () => {
    onDelete(price);
  };

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
    return colors[(price.channel_type - 1) % colors.length];
  };

  // 根据单位格式化价格
  const formatPrice = (value) => {
    if (value === 0) {
      return 'Free';
    }

    // 确定是否使用M单位和单位后缀
    let isM = unit === 'M';
    let unitLabel = '';

    if (price.type === 'tokens') {
      unitLabel = `/ 1${unit}`;
    } else {
      isM = false;
    }

    return ValueFormatter(value, true, isM) + unitLabel;
  };

  const channelColor = getChannelColor();
  const isLocked = price.locked;
  const hasHighlight = price.id % 8 === 0;

  // 根据计费类型获取对应颜色
  const getTypeColor = () => {
    if (price.type === 'tokens') {
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

  return (
    <TableRow
      sx={{
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        position: 'relative',
        bgcolor: hasHighlight ? alpha(theme.palette.primary.main, 0.03) : 'transparent',
        '&:hover': {
          bgcolor: alpha(theme.palette.primary.main, 0.05)
        },
        '&:hover .action-buttons': {
          opacity: 1
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 4,
          bottom: 4,
          width: 3,
          bgcolor: channelColor,
          borderRadius: '0 3px 3px 0'
        },
        // 添加轻微的过渡效果
        transition: 'background-color 0.15s ease'
      }}
    >
      {/* 模型名称 */}
      <TableCell
        sx={{
          pl: 2,
          py: 1.5,
          width: '20%',
          borderBottom: 'none',
          cursor: 'default'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{
              maxWidth: '85%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            title={price.model}
          >
            {price.model}
          </Typography>

          {isLocked && (
            <Tooltip title={t('pricing_edit.locked')} arrow>
              <LockIcon
                fontSize="small"
                sx={{
                  fontSize: '0.85rem',
                  ml: 0.5,
                  color: theme.palette.warning.main
                }}
              />
            </Tooltip>
          )}
        </Stack>

        <Stack direction="row" spacing={0.5} mt={0.5}>
          <Chip
            label={typeLabel}
            size="small"
            sx={{
              height: 18,
              fontSize: '0.65rem',
              fontWeight: 500,
              borderRadius: '2px',
              px: 0.5,
              bgcolor: typeColor.bg,
              color: typeColor.text,
              border: `1px solid ${typeColor.border}`
            }}
          />
          <Chip
            label={getChannelTypeName(price.channel_type)}
            size="small"
            sx={{
              height: 18,
              fontSize: '0.65rem',
              fontWeight: 500,
              borderRadius: '2px',
              bgcolor: alpha(channelColor, 0.1),
              color: channelColor,
              border: `1px solid ${alpha(channelColor, 0.2)}`,
              px: 0.5
            }}
          />
        </Stack>
      </TableCell>

      {/* 价格区域 */}
      <TableCell
        sx={{
          py: 1.5,
          width: '15%',
          borderBottom: 'none',
          cursor: 'default'
        }}
      >
        <Stack spacing={0.75}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              p: '2px 4px',
              borderRadius: '2px',
              transition: 'background-color 0.2s',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.05)
              }
            }}
          >
            <Icon icon="mdi:arrow-down-thin" width={14} style={{ color: theme.palette.primary.main }} className="input-icon" />
            <Typography variant="body2" fontWeight={600} title={t('modelpricePage.input')}>
              {formatPrice(price.input)}
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              p: '2px 4px',
              borderRadius: '2px',
              transition: 'background-color 0.2s',
              '&:hover': {
                bgcolor: alpha(theme.palette.secondary.main, 0.05)
              }
            }}
          >
            <Icon icon="mdi:arrow-up-thin" width={14} style={{ color: theme.palette.secondary.main }} className="output-icon" />
            <Typography variant="body2" fontWeight={600} title={t('modelpricePage.output')}>
              {formatPrice(price.output)}
            </Typography>
          </Box>
        </Stack>
      </TableCell>

      {/* 扩展价格区域 */}
      <TableCell
        sx={{
          py: 1.5,
          width: '55%',
          borderBottom: 'none',
          cursor: 'default'
        }}
      >
        {hasExtraRatios ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '2px 8px'
            }}
          >
            {Object.entries(price.extra_ratios).map(([key, value]) => (
              <Box
                key={key}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  p: '2px 4px',
                  borderRadius: '2px',
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.background.default, 0.6)
                  }
                }}
              >
                <Typography variant="caption" color="text.secondary" noWrap title={getReadableRatioName(key)} sx={{ fontSize: '0.7rem' }}>
                  {getReadableRatioName(key)}:
                </Typography>
                <Typography variant="caption" fontWeight={500}>
                  {value}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            {t('modelpricePage.noExtraRatios')}
          </Typography>
        )}
      </TableCell>

      {/* 操作按钮 */}
      <TableCell
        align="right"
        sx={{
          pr: 2,
          py: 1.5,
          width: '10%',
          borderBottom: 'none'
        }}
      >
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
                p: 0.5,
                color: theme.palette.primary.main,
                transition: 'transform 0.15s ease, background-color 0.15s',
                '&:hover': {
                  transform: 'scale(1.05)',
                  bgcolor: alpha(theme.palette.primary.main, 0.1)
                }
              }}
            >
              <Icon icon="mdi:pencil" width={16} />
            </IconButton>
          </Tooltip>

          <Tooltip title={t('common.delete')} arrow>
            <IconButton
              size="small"
              onClick={handleDelete}
              sx={{
                p: 0.5,
                color: theme.palette.error.main,
                transition: 'transform 0.15s ease, background-color 0.15s',
                '&:hover': {
                  transform: 'scale(1.05)',
                  bgcolor: alpha(theme.palette.error.main, 0.1)
                }
              }}
            >
              <Icon icon="mdi:delete" width={16} />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
};

PriceCard.propTypes = {
  price: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  ownedby: PropTypes.array.isRequired,
  unit: PropTypes.string
};

export default PriceCard;
