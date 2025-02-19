import PropTypes from 'prop-types';
import { useMemo } from 'react';
import Decimal from 'decimal.js';

import { styled } from '@mui/material/styles';
import Badge from '@mui/material/Badge';

import { TableRow, TableCell, Stack, Tooltip, Typography } from '@mui/material';

import { timestamp2string, renderQuota } from 'utils/common';
import Label from 'ui-component/Label';
import LogType from '../type/LogType';
import { useTranslation } from 'react-i18next';

function renderType(type) {
  const typeOption = LogType[type];
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

export default function LogTableRow({ item, userIsAdmin, userGroup }) {
  const { t } = useTranslation();
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

  return (
    <>
      <TableRow tabIndex={item.id}>
        <TableCell>{timestamp2string(item.created_at)}</TableCell>

        {userIsAdmin && <TableCell>{(item.channel_id || '') + ' ' + (item.channel?.name ? '(' + item.channel.name + ')' : '')}</TableCell>}
        {userIsAdmin && (
          <TableCell>
            <Label color="default" variant="outlined" copyText={item.username}>
              {item.username}
            </Label>
          </TableCell>
        )}

        <TableCell>
          {item?.metadata?.group_name ? (
            <Label color="default" variant="soft">
              {userGroup[item.metadata.group_name]?.name || '跟随用户'}
            </Label>
          ) : (
            ''
          )}
        </TableCell>
        <TableCell>
          {item.token_name && (
            <Label color="default" variant="soft" copyText={item.token_name}>
              {item.token_name}
            </Label>
          )}
        </TableCell>
        <TableCell>{renderType(item.type)}</TableCell>
        <TableCell>{viewModelName(item.model_name, item.is_stream)}</TableCell>

        <TableCell>
          <Stack direction="column" spacing={0.5}>
            <Label color={requestTimeLabelOptions(request_time)}>
              {item.request_time == 0 ? '无' : request_time_str} {first_time_str ? ' / ' + first_time_str : ''}
            </Label>

            {request_ts_str && <Label color={requestTSLabelOptions(request_ts)}>{request_ts_str}</Label>}
          </Stack>
        </TableCell>
        <TableCell>{viewInput(item, t, totalInputTokens, totalOutputTokens, show, tokenDetails)}</TableCell>
        <TableCell>{item.completion_tokens || ''}</TableCell>
        <TableCell>{item.quota ? renderQuota(item.quota, 6) : '$0'}</TableCell>
        <TableCell>{viewLogContent(item, t, totalInputTokens, totalOutputTokens)}</TableCell>
      </TableRow>
    </>
  );
}

LogTableRow.propTypes = {
  item: PropTypes.object,
  userIsAdmin: PropTypes.bool,
  userGroup: PropTypes.object
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

const MetadataTypography = styled(Typography)(({ theme }) => ({
  fontSize: 12,
  color: theme.palette.grey[300],
  '&:not(:last-child)': {
    marginBottom: theme.spacing(0.5)
  }
}));

function viewInput(item, t, totalInputTokens, totalOutputTokens, show, tokenDetails) {
  const { prompt_tokens } = item;

  if (!prompt_tokens) return '';
  if (!show) return prompt_tokens;

  const tooltipContent = tokenDetails.map(({ key, label, tokens, value, rate, labelParams }) => (
    <MetadataTypography key={key}>{`${t(label, labelParams)}: ${value} * ${rate} = ${tokens}`}</MetadataTypography>
  ));

  return (
    <Badge variant="dot" color="primary">
      <Tooltip
        title={
          <>
            {tooltipContent}
            <MetadataTypography>
              {t('logPage.totalInputTokens')}: {totalInputTokens}
            </MetadataTypography>
            <MetadataTypography>
              {t('logPage.totalOutputTokens')}: {totalOutputTokens}
            </MetadataTypography>
          </>
        }
        placement="top"
        arrow
      >
        <span style={{ cursor: 'help' }}>{prompt_tokens}</span>
      </Tooltip>
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
  const cached_write_ratio = metadata?.cached_write_ratio || 0;
  const cached_read_ratio = metadata?.cached_read_ratio || 0;

  const tokenDetails = [
    { key: 'input_text_tokens', label: 'logPage.inputTextTokens', rate: TOKEN_RATIOS.TEXT },
    { key: 'output_text_tokens', label: 'logPage.outputTextTokens', rate: TOKEN_RATIOS.TEXT },
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
    { key: 'cached_tokens', label: 'logPage.cachedTokens', rate: cached_ratio },
    { key: 'cached_write_tokens', label: 'logPage.cachedWriteTokens', rate: cached_write_ratio },
    { key: 'cached_read_tokens', label: 'logPage.cachedReadTokens', rate: cached_read_ratio }
  ]
    .filter(({ key }) => metadata[key] > 0)
    .map(({ key, label, rate, labelParams }) => {
      const tokens = Math.ceil(metadata[key] * rate);

      if (key === 'input_audio_tokens' || key === 'cached_tokens') {
        totalInputTokens += tokens - metadata[key];
        show = true;
      } else if (key === 'output_audio_tokens') {
        totalOutputTokens += tokens - metadata[key];
        show = true;
      } else if (key === 'cached_write_tokens' || key === 'cached_read_tokens') {
        totalInputTokens += tokens;
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

function viewLogContent(item, t, totalInputTokens, totalOutputTokens) {
  if (!item?.metadata?.input_ratio) {
    return item.content;
  }

  const groupDiscount = item?.metadata?.group_ratio || 1;

  const priceType = item?.metadata?.price_type;
  const originalCompletionRatio = item?.metadata?.output_ratio;
  const originalInputRatio = item?.metadata?.input_ratio;

  let inputPriceInfo = '';
  let outputPriceInfo = '';
  let calculateSteps = '';
  let originalInputPriceInfo = '';
  let originalOutputPriceInfo = '';

  if (priceType === 'times') {
    const inputPrice = calculatePrice(originalInputRatio, groupDiscount, true);

    inputPriceInfo = t('logPage.content.times_price', {
      times: inputPrice
    });

    const originalInputPrice = calculatePrice(originalInputRatio, 1, 1, true, true);

    originalInputPriceInfo = t('logPage.content.original_times_price', {
      times: originalInputPrice
    });
  } else {
    const inputPrice = calculatePrice(originalInputRatio, groupDiscount, false);
    const outputPrice = calculatePrice(originalCompletionRatio, groupDiscount, false);

    inputPriceInfo = t('logPage.content.input_price', {
      price: inputPrice
    });
    outputPriceInfo = t('logPage.content.output_price', {
      price: outputPrice
    });

    const originalInputPrice = calculatePrice(originalInputRatio, 1, false);

    originalInputPriceInfo = t('logPage.content.original_input_price', {
      price: originalInputPrice
    });

    const originalOutputPrice = calculatePrice(originalCompletionRatio, 1, false);

    originalOutputPriceInfo = t('logPage.content.original_output_price', {
      price: originalOutputPrice
    });

    calculateSteps = `${t('logPage.content.calculate_steps')}( ${totalInputTokens} / 1000000 * ${inputPrice}) `;

    if (totalOutputTokens > 0) {
      calculateSteps += `+ (${totalOutputTokens} / 1000000 * ${outputPrice})`;
    }

    calculateSteps += ` = ${renderQuota(item.quota, 6)}`;
  }

  const tips = (
    <>
      {originalInputPriceInfo && <MetadataTypography>{originalInputPriceInfo}</MetadataTypography>}
      {originalOutputPriceInfo && <MetadataTypography>{originalOutputPriceInfo}</MetadataTypography>}
      {groupDiscount > 0 && groupDiscount !== 1 && (
        <MetadataTypography>
          {t('logPage.content.group_discount', {
            discount: getDiscountLang(groupDiscount, 1)
          })}
        </MetadataTypography>
      )}
      {calculateSteps && (
        <>
          <MetadataTypography>{calculateSteps}</MetadataTypography>
          <MetadataTypography>{t('logPage.content.calculate_steps_tip')}</MetadataTypography>
        </>
      )}
    </>
  );

  return (
    <Tooltip title={tips} placement="top" arrow>
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
    </Tooltip>
  );
}

function calculatePrice(ratio, groupDiscount, isTimes) {
  let discount = new Decimal(ratio).mul(groupDiscount);

  if (!isTimes) {
    discount = discount.mul(1000);
  }

  let price = discount.mul(0.002).toFixed(6);
  price = price.replace(/(\.\d*?[1-9])0+$|\.0*$/, '$1');

  return price;
}

export function getDiscountLang(value1, value2) {
  const discount = new Decimal(value1).mul(value2);

  const discountMultiplier = discount.toFixed(2);
  return `${discountMultiplier} 倍`;
}
