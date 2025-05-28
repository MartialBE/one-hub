import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
import Decimal from 'decimal.js';

import { styled } from '@mui/material/styles';
import Badge from '@mui/material/Badge';

import { TableRow, TableCell, Stack, Tooltip, Typography, Box, IconButton, Collapse } from '@mui/material';

import { timestamp2string, renderQuota } from 'utils/common';
import Label from 'ui-component/Label';
import { useLogType } from '../type/LogType';
import { useTranslation } from 'react-i18next';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PercentIcon from '@mui/icons-material/Percent';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import CalculateIcon from '@mui/icons-material/Calculate';

function renderType(type, logTypes) {
  const typeOption = logTypes[type];
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

function requestTimeLabelOptions(request_time) {
  let color = 'error';
  if (request_time === 0) {
    color = 'default';
  } else if (request_time <= 10) {
    color = 'success';
  } else if (request_time <= 50) {
    color = 'primary';
  } else if (request_time <= 100) {
    color = 'secondary';
  }

  return color;
}

function requestTSLabelOptions(request_ts) {
  let color = 'success';
  if (request_ts === 0) {
    color = 'default';
  } else if (request_ts <= 10) {
    color = 'error';
  } else if (request_ts <= 15) {
    color = 'secondary';
  } else if (request_ts <= 20) {
    color = 'primary';
  }

  return color;
}

export default function LogTableRow({ item, userIsAdmin, userGroup, columnVisibility }) {
  const { t } = useTranslation();
  const LogType = useLogType();
  let request_time = item.request_time / 1000;
  let request_time_str = request_time.toFixed(2) + ' S';

  let first_time = item.metadata?.first_response ? item.metadata.first_response / 1000 : 0;
  let first_time_str = first_time ? `${first_time.toFixed(2)} S` : '';

  const stream_time = request_time - first_time;

  let request_ts = 0;
  let request_ts_str = '';
  if (first_time > 0 && item.completion_tokens > 0) {
    request_ts = (item.completion_tokens ? item.completion_tokens : 1) / stream_time;
    request_ts_str = `${request_ts.toFixed(2)} t/s`;
  }

  const { totalInputTokens, totalOutputTokens, show, tokenDetails } = useMemo(() => calculateTokens(item), [item]);

  // 计算当前显示的列数
  const colCount = Object.values(columnVisibility).filter(Boolean).length;

  // 展开状态（仅type=2时才有展开）
  const [open, setOpen] = useState(false);
  const showExpand = item.type === 2 && columnVisibility.quota;

  return (
    <>
      <TableRow tabIndex={item.id}>
        {columnVisibility.created_at && <TableCell sx={{ p: '10px 8px' }}>{timestamp2string(item.created_at)}</TableCell>}

        {userIsAdmin && columnVisibility.channel_id && (
          <TableCell sx={{ p: '10px 8px' }}>
            {(item.channel_id || '') + ' ' + (item.channel?.name ? '(' + item.channel.name + ')' : '')}
          </TableCell>
        )}
        {userIsAdmin && columnVisibility.user_id && (
          <TableCell sx={{ p: '10px 8px' }}>
            <Label color="default" variant="outlined" copyText={item.username}>
              {item.username}
            </Label>
          </TableCell>
        )}

        {columnVisibility.group && (
          <TableCell sx={{ p: '10px 8px' }}>
            {item?.metadata?.group_name ? (
              <Label color="default" variant="soft">
                {userGroup[item.metadata.group_name]?.name || '跟随用户'}
              </Label>
            ) : (
              ''
            )}
          </TableCell>
        )}
        {columnVisibility.token_name && (
          <TableCell sx={{ p: '10px 8px' }}>
            {item.token_name && (
              <Label color="default" variant="soft" copyText={item.token_name}>
                {item.token_name}
              </Label>
            )}
          </TableCell>
        )}
        {columnVisibility.type && <TableCell sx={{ p: '10px 8px' }}>{renderType(item.type, LogType)}</TableCell>}
        {columnVisibility.model_name && <TableCell sx={{ p: '10px 8px' }}>{viewModelName(item.model_name, item.is_stream)}</TableCell>}

        {columnVisibility.duration && (
          <TableCell sx={{ p: '10px 8px' }}>
            <Stack direction="column" spacing={0.5}>
              <Label color={requestTimeLabelOptions(request_time)}>
                {item.request_time == 0 ? '无' : request_time_str} {first_time_str ? ' / ' + first_time_str : ''}
              </Label>

              {request_ts_str && <Label color={requestTSLabelOptions(request_ts)}>{request_ts_str}</Label>}
            </Stack>
          </TableCell>
        )}
        {columnVisibility.message && (
          <TableCell sx={{ p: '10px 8px' }}>{viewInput(item, t, totalInputTokens, totalOutputTokens, show, tokenDetails)}</TableCell>
        )}
        {columnVisibility.completion && <TableCell sx={{ p: '10px 8px' }}>{item.completion_tokens || ''}</TableCell>}
        {columnVisibility.quota && (
          <TableCell sx={{ p: '10px 8px' }}>
            {item.type === 2 ? (
              <QuotaWithDetailRow item={item} open={open} setOpen={setOpen} />
            ) : item.quota ? (
              renderQuota(item.quota, 6)
            ) : (
              '$0'
            )}
          </TableCell>
        )}
        {columnVisibility.source_ip && <TableCell sx={{ p: '10px 8px' }}>{item.source_ip || ''}</TableCell>}
        {columnVisibility.detail && (
          <TableCell sx={{ p: '10px 8px' }}>{viewLogContent(item, t, totalInputTokens, totalOutputTokens)}</TableCell>
        )}
      </TableRow>
      {/* 展开行 */}
      {showExpand && (
        <TableRow>
          <TableCell colSpan={colCount} sx={{ p: 0, border: 0, bgcolor: 'transparent' }}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <QuotaWithDetailContent item={item} />
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

LogTableRow.propTypes = {
  item: PropTypes.object,
  userIsAdmin: PropTypes.bool,
  userGroup: PropTypes.object,
  columnVisibility: PropTypes.object
};

function viewModelName(model_name, isStream) {
  if (!model_name) {
    return '';
  }

  if (isStream) {
    return (
      <Badge
        badgeContent="Stream"
        color="primary"
        sx={{
          '& .MuiBadge-badge': {
            fontSize: '0.55rem',
            height: '16px',
            minWidth: '16px',
            padding: '0 4px',
            top: '-3px'
          }
        }}
      >
        <Label color="primary" variant="outlined" copyText={model_name}>
          {model_name}
        </Label>
      </Badge>
    );
  }

  return (
    <Label color="primary" variant="outlined" copyText={model_name}>
      {model_name}
    </Label>
  );
}
styled(Typography)(({ theme }) => ({
  fontSize: 12,
  color: theme.palette.grey[300],
  '&:not(:last-child)': {
    marginBottom: theme.spacing(0.5)
  }
}));
function viewInput(item, t, totalInputTokens, totalOutputTokens, show) {
  const { prompt_tokens } = item;

  if (!prompt_tokens) return '';
  if (!show) return prompt_tokens;

  return (
    <Badge variant="dot" color="primary">
      <span>{prompt_tokens}</span>
    </Badge>
  );
}

const TOKEN_RATIOS = {
  INPUT_AUDIO: 20,
  OUTPUT_AUDIO: 10,
  CACHED: 0.5,
  TEXT: 1
};

function calculateTokens(item) {
  const { prompt_tokens, completion_tokens, metadata } = item;

  if (!prompt_tokens || !metadata) {
    return {
      totalInputTokens: prompt_tokens || 0,
      totalOutputTokens: completion_tokens || 0,
      show: false,
      tokenDetails: []
    };
  }

  let totalInputTokens = prompt_tokens;
  let totalOutputTokens = completion_tokens;
  let show = false;

  const input_audio_tokens = metadata?.input_audio_tokens_ratio || TOKEN_RATIOS.INPUT_AUDIO;
  const output_audio_tokens = metadata?.output_audio_tokens_ratio || TOKEN_RATIOS.OUTPUT_AUDIO;

  const cached_ratio = metadata?.cached_tokens_ratio || TOKEN_RATIOS.CACHED;
  const cached_write_ratio = metadata?.cached_write_tokens_ratio || 0;
  const cached_read_ratio = metadata?.cached_recached_read_tokens_ratioad_ratio || 0;
  const reasoning_tokens = metadata?.reasoning_tokens_ratio || 0;
  const input_text_tokens_ratio = metadata?.input_text_tokens_ratio || TOKEN_RATIOS.TEXT;
  const output_text_tokens_ratio = metadata?.output_text_tokens_ratio || TOKEN_RATIOS.TEXT;

  const tokenDetails = [
    {
      key: 'input_text_tokens',
      label: 'logPage.inputTextTokens',
      rate: input_text_tokens_ratio,
      labelParams: { ratio: input_text_tokens_ratio }
    },
    {
      key: 'output_text_tokens',
      label: 'logPage.outputTextTokens',
      rate: output_text_tokens_ratio,
      labelParams: { ratio: output_text_tokens_ratio }
    },
    {
      key: 'input_audio_tokens',
      label: 'logPage.inputAudioTokens',
      rate: input_audio_tokens,
      labelParams: { ratio: input_audio_tokens }
    },
    {
      key: 'output_audio_tokens',
      label: 'logPage.outputAudioTokens',
      rate: output_audio_tokens,
      labelParams: { ratio: output_audio_tokens }
    },
    { key: 'cached_tokens', label: 'logPage.cachedTokens', rate: cached_ratio, labelParams: { ratio: cached_ratio } },
    {
      key: 'cached_write_tokens',
      label: 'logPage.cachedWriteTokens',
      rate: cached_write_ratio,
      labelParams: { ratio: cached_write_ratio }
    },
    { key: 'cached_read_tokens', label: 'logPage.cachedReadTokens', rate: cached_read_ratio, labelParams: { ratio: cached_read_ratio } },
    { key: 'reasoning_tokens', label: 'logPage.reasoningTokens', rate: reasoning_tokens, labelParams: { ratio: reasoning_tokens } }
  ]
    .filter(({ key }) => metadata[key] > 0)
    .map(({ key, label, rate, labelParams }) => {
      const tokens = Math.ceil(metadata[key] * (rate - 1));

      if (
        key === 'input_text_tokens' ||
        key === 'output_text_tokens' ||
        key === 'input_audio_tokens' ||
        key === 'cached_tokens' ||
        key === 'cached_write_tokens' ||
        key === 'cached_read_tokens'
      ) {
        totalInputTokens += tokens;
        show = true;
      } else if (key === 'output_audio_tokens' || key === 'reasoning_tokens') {
        totalOutputTokens += tokens;
        show = true;
      }

      return { key, label, tokens, value: metadata[key], rate, labelParams };
    });

  return {
    totalInputTokens,
    totalOutputTokens,
    show,
    tokenDetails
  };
}

function viewLogContent(item, t, totalInputTokens) {
  // Check if we have the necessary data to calculate prices
  if (!item?.metadata?.input_ratio) {
    let free = false;
    if ((item.quota === 0 || item.quota === undefined) && item.type === 2) {
      free = true;
    }
    return free ? (
      <Stack direction="column" spacing={0.3}>
        <Label color={free ? 'success' : 'secondary'} variant="soft">
          {t('logPage.content.free')}
        </Label>
      </Stack>
    ) : (
      <>{item.content || ''}</>
    );
  }

  // Ensure we have valid values with appropriate defaults
  const groupDiscount = item?.metadata?.group_ratio || 1;
  const priceType = item?.metadata?.price_type || '';
  const originalCompletionRatio = item?.metadata?.output_ratio || 0;
  const originalInputRatio = item?.metadata?.input_ratio || 0;

  let inputPriceInfo = '';
  let outputPriceInfo = '';
  if (priceType === 'times') {
    // Calculate prices for 'times' price type
    const inputPrice = calculatePrice(originalInputRatio, groupDiscount, true);

    inputPriceInfo = t('logPage.content.times_price', {
      times: inputPrice
    });
  } else {
    // Calculate prices for standard price type
    const inputPrice = calculatePrice(originalInputRatio, groupDiscount, false);
    const outputPrice = calculatePrice(originalCompletionRatio, groupDiscount, false);

    inputPriceInfo = t('logPage.content.input_price', {
      price: inputPrice
    });
    outputPriceInfo = t('logPage.content.output_price', {
      price: outputPrice
    });

    // Create calculation explanation string
    `${t('logPage.content.calculate_steps')}( ${totalInputTokens} / 1000000 * ${inputPrice}) `;
  }

  return (
    <Stack direction="column" spacing={0.3}>
      {inputPriceInfo && (
        <Label color="info" variant="soft">
          {inputPriceInfo}
        </Label>
      )}
      {outputPriceInfo && (
        <Label color="info" variant="soft">
          {outputPriceInfo}
        </Label>
      )}
    </Stack>
  );
}

function calculatePrice(ratio, groupDiscount, isTimes) {
  // Ensure inputs are valid numbers
  ratio = ratio || 0;
  groupDiscount = groupDiscount || 0;

  let discount = new Decimal(ratio).mul(groupDiscount);

  if (!isTimes) {
    discount = discount.mul(1000);
  }

  // Calculate the price as a Decimal
  let priceDecimal = discount.mul(0.002);

  // For display purposes, format with 6 decimal places and trim trailing zeros
  let priceString = priceDecimal.toFixed(6);
  priceString = priceString.replace(/(\.\d*?[1-9])0+$|\.0*$/, '$1');

  // For calculations, return the actual number value
  return priceString;
}

// Function to calculate price as a number for calculations
export function getDiscountLang(value1, value2) {
  const discount = new Decimal(value1).mul(value2);

  const discountMultiplier = discount.toFixed(2);
  return `${discountMultiplier} 倍`;
}

// Helper function to calculate the original quota based on actual price and group ratio
function calculateOriginalQuota(item) {
  // If we don't have the necessary data, return the metadata value or 0
  if (!item?.quota || !item?.metadata?.group_ratio) {
    return item.metadata?.original_quota || item.metadata?.origin_quota || 0;
  }

  const quota = item.quota || 0;
  const groupRatio = item.metadata?.group_ratio || 1;

  // Simple formula: original price = actual price / group ratio
  // Avoid division by zero
  if (groupRatio === 0) {
    return quota;
  }

  // Calculate original quota by dividing actual quota by group ratio
  const calculatedOriginalQuota = quota / groupRatio;

  // Return the calculated original quota, or the metadata value if calculation is 0
  return calculatedOriginalQuota || item.metadata?.original_quota || item.metadata?.origin_quota || 0;
}

// QuotaWithDetailRow 只负责主行的价格和小三角
function QuotaWithDetailRow({ item, open, setOpen }) {
  // Calculate the original quota based on the formula
  const originalQuota = calculateOriginalQuota(item);
  // Ensure quota has a fallback value
  const quota = item.quota || 0;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box onClick={() => setOpen((o) => !o)} sx={{ display: 'flex', flexDirection: 'column', mr: 1 }}>
        <Typography variant="caption" sx={{ color: (theme) => theme.palette.text.secondary, textDecoration: 'line-through', fontSize: 12 }}>
          {renderQuota(originalQuota, 6)}
        </Typography>
        <Typography sx={{ color: (theme) => theme.palette.success.main, fontWeight: 500, fontSize: 13 }}>
          {renderQuota(quota, 6)}
        </Typography>
      </Box>
      <IconButton
        size="small"
        onClick={() => setOpen((o) => !o)}
        sx={{
          ml: 0.5,
          bgcolor: (theme) => (open ? theme.palette.action.hover : 'transparent'),
          '&:hover': { bgcolor: (theme) => theme.palette.action.hover }
        }}
      >
        <ExpandMoreIcon
          style={{
            transition: '0.2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
          fontSize="small"
        />
      </IconButton>
    </Box>
  );
}

// QuotaWithDetailContent 负责渲染详细内容
function QuotaWithDetailContent({ item }) {
  // Calculate the original quota based on the formula
  const originalQuota = calculateOriginalQuota(item);
  const quota = item.quota || 0;

  // Get input/output prices from metadata with appropriate defaults
  const originalInputPrice =
    item.metadata?.input_price_origin ||
    (item.metadata?.input_ratio ? `$${calculatePrice(item.metadata.input_ratio, 1, false)} /M` : '$0 /M');
  const originalOutputPrice =
    item.metadata?.output_price_origin ||
    (item.metadata?.output_ratio ? `$${calculatePrice(item.metadata.output_ratio, 1, false)} /M` : '$0 /M');

  // Calculate actual prices based on ratios and group discount
  const groupRatio = item.metadata?.group_ratio || 1;
  const inputPrice =
    item.metadata?.input_price ||
    (item.metadata?.input_ratio ? `$${calculatePrice(item.metadata.input_ratio, groupRatio, false)} /M` : '$0 /M');
  const outputPrice =
    item.metadata?.output_price ||
    (item.metadata?.output_ratio ? `$${calculatePrice(item.metadata.output_ratio, groupRatio, false)} /M` : '$0 /M');

  const inputTokens = item.prompt_tokens || 0;
  const outputTokens = item.completion_tokens || 0;

  // Create a calculation explanation string
  const stepStr = `(${inputTokens} / 1,000,000 * ${inputPrice})${outputTokens > 0 ? ` + (${outputTokens} / 1,000,000 * ${outputPrice})` : ''} = ${renderQuota(quota, 6)}`;

  let savePercent = '';
  if (originalQuota > 0 && quota > 0) {
    savePercent = `节省${((1 - quota / originalQuota) * 100).toFixed(0)}%`;
  }
  return (
    <Box
      sx={{
        mt: 2,
        mb: 2,
        mx: 2,
        boxShadow: (theme) => `0 2px 8px 0 ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.04)'}`,
        borderRadius: 2,
        background: (theme) => theme.palette.background.paper,
        p: 0
      }}
    >
      {/* 上方三栏 */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          background: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.default : '#fafbfc'),
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8
        }}
      >
        {/* 原始价格 */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            p: 2,
            borderRight: { xs: 'none', sm: (theme) => `1px solid ${theme.palette.divider}` },
            borderBottom: { xs: (theme) => `1px solid ${theme.palette.divider}`, sm: 'none' }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <AttachMoneyIcon sx={{ fontSize: 20, mr: 1, color: (theme) => theme.palette.text.secondary }} />
            <Typography sx={{ fontWeight: 600, fontSize: 15 }}>原始价格</Typography>
          </Box>
          <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary, mb: 0.5, textAlign: 'left' }}>
            输入价格：{originalInputPrice}
          </Typography>
          <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary, textAlign: 'left' }}>
            输出价格：{originalOutputPrice}
          </Typography>
        </Box>
        {/* 分组倍率 */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            p: 2,
            borderRight: { xs: 'none', sm: (theme) => `1px solid ${theme.palette.divider}` },
            borderBottom: { xs: (theme) => `1px solid ${theme.palette.divider}`, sm: 'none' }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <PercentIcon sx={{ fontSize: 20, mr: 1, color: (theme) => theme.palette.info.main }} />
            <Typography sx={{ fontWeight: 600, fontSize: 15 }}>分组倍率</Typography>
          </Box>
          <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary, textAlign: 'left' }}>
            分组倍率：{groupRatio}
          </Typography>
        </Box>
        {/* 实际价格 */}
        <Box sx={{ flex: 1, minWidth: 0, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <CreditCardIcon sx={{ fontSize: 20, mr: 1, color: (theme) => theme.palette.primary.main }} />
            <Typography sx={{ fontWeight: 600, fontSize: 15 }}>实际价格</Typography>
          </Box>
          <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary, mb: 0.5, textAlign: 'left' }}>
            输入：{inputPrice}
          </Typography>
          <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary, textAlign: 'left' }}>
            输出：{outputPrice}
          </Typography>
        </Box>
      </Box>
      {/* 下方最终计算区域 */}
      <Box
        sx={{
          p: 2,
          background: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.default : '#f7f8fa'),
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <CalculateIcon sx={{ fontSize: 20, mr: 1, color: (theme) => theme.palette.success.main }} />
          <Typography sx={{ fontWeight: 600, fontSize: 15 }}>最终计算</Typography>
        </Box>
        <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary, mb: 1, textAlign: 'left' }}>{stepStr}</Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, mb: 1 }}>
          <Typography
            sx={{
              fontSize: 13,
              color: (theme) => theme.palette.text.secondary,
              textDecoration: 'line-through',
              mr: 2,
              mb: { xs: 0.5, sm: 0 },
              textAlign: 'left'
            }}
          >
            原始计费：{renderQuota(originalQuota, 6)}
          </Typography>
          <Typography
            sx={{
              fontSize: 13,
              color: (theme) => theme.palette.success.main,
              fontWeight: 500,
              mr: 2,
              mb: { xs: 0.5, sm: 0 },
              textAlign: 'left'
            }}
          >
            实际计费：{renderQuota(quota, 6)}
          </Typography>
          {savePercent && (
            <Box
              sx={{
                display: 'inline-block',
                bgcolor: (theme) => theme.palette.success.dark,
                color: (theme) => theme.palette.success.contrastText,
                fontSize: 12,
                fontWeight: 500,
                borderRadius: 1,
                px: 1.2,
                py: 0.2
              }}
            >
              {savePercent}
            </Box>
          )}
        </Box>
        <Typography sx={{ fontSize: 12, color: (theme) => theme.palette.text.disabled, textAlign: 'left' }}>
          PS：本系统按积分分计算，所有金额均为积分换算，1积分=$0.000002，最低消费为1积分，本计算步骤仅供参考，以实际扣费为准
        </Typography>
      </Box>
    </Box>
  );
}
