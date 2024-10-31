import PropTypes from 'prop-types';

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
  } else if (request_time <= 1000) {
    color = 'success';
  } else if (request_time <= 3000) {
    color = 'primary';
  } else if (request_time <= 5000) {
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
  let request_time_str = request_time.toFixed(2) + ' 秒';
  let request_ts = 0;
  let request_ts_str = '';
  if (request_time > 0 && item.completion_tokens > 0) {
    request_ts = (item.completion_tokens ? item.completion_tokens : 1) / request_time;
    request_ts_str = request_ts.toFixed(2) + ' t/s';
  }

  return (
    <>
      <TableRow tabIndex={item.id}>
        <TableCell>{timestamp2string(item.created_at)}</TableCell>

        {userIsAdmin && <TableCell>{(item.channel_id || '') + ' ' + (item.channel?.name ? '(' + item.channel.name + ')' : '')}</TableCell>}
        {userIsAdmin && (
          <TableCell>
            <Label color="default" variant="outlined">
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
            <Label color="default" variant="soft">
              {item.token_name}
            </Label>
          )}
        </TableCell>
        <TableCell>{renderType(item.type)}</TableCell>
        <TableCell>{viewModelName(item.model_name, item.is_stream)}</TableCell>

        <TableCell>
          <Stack direction="row" spacing={1}>
            <Label color={requestTimeLabelOptions(item.request_time)}> {item.request_time == 0 ? '无' : request_time_str} </Label>
            {request_ts_str && <Label color={requestTSLabelOptions(request_ts)}> {request_ts_str} </Label>}
          </Stack>
        </TableCell>
        <TableCell>{viewInput(item, t)}</TableCell>
        <TableCell>{item.completion_tokens || ''}</TableCell>
        <TableCell>{item.quota ? renderQuota(item.quota, 6) : '$0'}</TableCell>
        <TableCell>{item.content}</TableCell>
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
        <Label color="primary" variant="outlined">
          {model_name}
        </Label>
      </Badge>
    );
  }

  return (
    <Label color="primary" variant="outlined">
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

function viewInput(item, t) {
  const { prompt_tokens, completion_tokens, metadata } = item;

  if (!prompt_tokens) return '';
  if (!metadata) return prompt_tokens;

  let totalInputTokens = prompt_tokens;
  let totalOutputTokens = completion_tokens;

  let show = false;
  const inputAudioTokensRatio = metadata?.input_audio_tokens_ratio || 20;
  const outputAudioTokensRatio = metadata?.output_audio_tokens_ratio || 10;

  const tooltipContent = [
    { key: 'input_text_tokens', label: t('logPage.inputTextTokens'), rate: 1 },
    { key: 'output_text_tokens', label: t('logPage.outputTextTokens'), rate: 1 },
    { key: 'input_audio_tokens', label: t('logPage.inputAudioTokens'), rate: inputAudioTokensRatio },
    { key: 'output_audio_tokens', label: t('logPage.outputAudioTokens'), rate: outputAudioTokensRatio },
    { key: 'cached_tokens', label: t('logPage.cachedTokens'), rate: 0.5 }
  ]
    .filter(({ key }) => metadata[key] > 0)
    .map(({ key, label, rate }) => {
      const tokens = Math.ceil(metadata[key] * rate);
      if (key === 'input_audio_tokens' || key === 'cached_tokens') {
        totalInputTokens += tokens - metadata[key];
        show = true;
      } else if (key === 'output_audio_tokens') {
        totalOutputTokens += tokens - metadata[key];
        show = true;
      }

      return <MetadataTypography key={key}>{`${label}: ${metadata[key]} * ${rate} = ${tokens}`}</MetadataTypography>;
    });

  if (!show) {
    return prompt_tokens;
  }

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
