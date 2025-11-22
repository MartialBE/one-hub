import PropTypes from 'prop-types';
import { Card, CardContent, Typography, Box, Avatar, Stack, IconButton, Tooltip, Chip, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import { Icon } from '@iconify/react';
import Label from 'ui-component/Label';
import { MODALITY_OPTIONS } from 'constants/Modality';
import { copy } from 'utils/common';
import { useTranslation } from 'react-i18next';
// ----------------------------------------------------------------------

export default function ModelCard({ model, provider, modelInfo, price, group, ownedbyIcon, type, formatPrice, onViewDetail }) {
  const theme = useTheme();
  const { t } = useTranslation();
  // 解析输入输出模态
  const getModalities = (modalitiesStr) => {
    try {
      return JSON.parse(modalitiesStr || '[]');
    } catch (e) {
      return [];
    }
  };

  // 解析标签
  const getTags = (tagsStr) => {
    try {
      return JSON.parse(tagsStr || '[]');
    } catch (e) {
      return [];
    }
  };

  const inputModalities = modelInfo ? getModalities(modelInfo.input_modalities) : [];
  const outputModalities = modelInfo ? getModalities(modelInfo.output_modalities) : [];
  const tags = modelInfo ? getTags(modelInfo.tags) : [];

  const isPriceAvailable = typeof price.input === 'number' && typeof price.output === 'number';

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.6) : theme.palette.background.paper,
        borderRadius: '12px',
        border: `1px solid ${theme.palette.mode === 'dark' ? alpha('#fff', 0.08) : alpha('#000', 0.05)}`,
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.palette.mode === 'dark' ? '0 12px 24px rgba(0,0,0,0.4)' : '0 12px 24px rgba(0,0,0,0.1)',
          borderColor: alpha(theme.palette.primary.main, 0.3)
        }
      }}
    >
      {/* 卡片头部 */}
      <Box
        sx={{
          p: 2,
          pb: 1.5,
          background:
            theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`
              : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
          borderBottom: `1px solid ${theme.palette.mode === 'dark' ? alpha('#fff', 0.05) : alpha('#000', 0.03)}`
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
            {ownedbyIcon && (
              <Avatar
                src={ownedbyIcon}
                alt={provider}
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor: theme.palette.mode === 'dark' ? '#fff' : theme.palette.background.paper,
                  '.MuiAvatar-img': {
                    objectFit: 'contain',
                    padding: '4px'
                  }
                }}
              >
                {provider?.charAt(0).toUpperCase()}
              </Avatar>
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Tooltip title={model}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '0.95rem',
                    color: theme.palette.text.primary
                  }}
                >
                  {model}
                </Typography>
              </Tooltip>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                {provider}
              </Typography>
            </Box>
          </Stack>
          <Tooltip title={t('modelpricePage.copyModelId')}>
            <IconButton size="small" onClick={() => copy(model, t('modelpricePage.modelId'))} sx={{ color: theme.palette.text.secondary }}>
              <Icon icon="eva:copy-outline" width={18} height={18} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* 模型描述 */}
        {modelInfo?.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              fontSize: '0.8125rem',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minHeight: '2.5em'
            }}
          >
            {modelInfo.description}
          </Typography>
        )}

        {/* 模态和标签 */}
        <Stack spacing={1.5} sx={{ mb: 2 }}>
          {/* 输入模态 */}
          {inputModalities.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                {t('modelpricePage.inputModality')}
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {inputModalities.map((modality, index) => (
                  <Label
                    key={index}
                    variant="soft"
                    color={MODALITY_OPTIONS[modality]?.color || 'primary'}
                    sx={{ fontSize: '0.7rem', py: 0.25, px: 0.75 }}
                  >
                    {MODALITY_OPTIONS[modality]?.text || modality}
                  </Label>
                ))}
              </Stack>
            </Box>
          )}

          {/* 输出模态 */}
          {outputModalities.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                {t('modelpricePage.outputModality')}
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {outputModalities.map((modality, index) => (
                  <Label
                    key={index}
                    variant="soft"
                    color={MODALITY_OPTIONS[modality]?.color || 'secondary'}
                    sx={{ fontSize: '0.7rem', py: 0.25, px: 0.75 }}
                  >
                    {MODALITY_OPTIONS[modality]?.text || modality}
                  </Label>
                ))}
              </Stack>
            </Box>
          )}

          {/* 标签 */}
          {tags.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                {t('modelpricePage.tags')}
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {tags.map((tag, index) => (
                  <Label
                    key={index}
                    variant="soft"
                    color={tag === 'Hot' ? 'error' : 'primary'}
                    sx={{
                      fontSize: '0.7rem',
                      py: 0.25,
                      px: 0.75,
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center'
                    }}
                  >
                    {tag === 'Hot' && <Icon icon="ic:round-local-fire-department" width={14} height={14} style={{ marginRight: 4 }} />}
                    {tag}
                  </Label>
                ))}
              </Stack>
            </Box>
          )}
          {/* 标签 */}

          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
              {t('modelpricePage.billingMethod')}
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {type === 'tokens' && (
                <Label color="success" variant="soft" sx={{ fontWeight: 600 }}>
                  {t('modelpricePage.tokens')}
                </Label>
              )}
              {type === 'times' && (
                <Label color="warning" variant="soft" sx={{ fontWeight: 600 }}>
                  {t('modelpricePage.times')}
                </Label>
              )}
            </Stack>
          </Box>
        </Stack>

        {/* 价格信息 */}
        <Box
          sx={{ mt: 'auto', pt: 2, borderTop: `1px solid ${theme.palette.mode === 'dark' ? alpha('#fff', 0.05) : alpha('#000', 0.05)}` }}
        >
          {isPriceAvailable ? (
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  {t('modelpricePage.inputMultiplier')}
                </Typography>
                <Label color="success" variant="outlined" sx={{ fontSize: '0.75rem', py: 0.25, px: 0.75, fontWeight: 600 }}>
                  {formatPrice(price.input, type)}
                </Label>
              </Stack>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  {t('modelpricePage.outputMultiplier')}
                </Typography>
                <Label color="warning" variant="outlined" sx={{ fontSize: '0.75rem', py: 0.25, px: 0.75, fontWeight: 600 }}>
                  {formatPrice(price.output, type)}
                </Label>
              </Stack>
            </Stack>
          ) : (
            <Box
              sx={{
                textAlign: 'center',
                py: 1,
                px: 2,
                borderRadius: '8px',
                backgroundColor: alpha(theme.palette.error.main, 0.1),
                border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`
              }}
            >
              <Typography variant="body2" color="error.main" sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                {price.input}
              </Typography>
            </Box>
          )}

          {/* 用户组信息 */}
          {group && (
            <Box sx={{ mt: 1.5 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  {t('modelpricePage.currentUserGroup')}
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Label color="primary" sx={{ fontSize: '0.7rem', py: 0.25, px: 0.75 }}>
                    {group.name}
                  </Label>
                  {group.ratio > 0 && (
                    <Label color={group.ratio > 1 ? 'warning' : 'info'} sx={{ fontSize: '0.7rem', py: 0.25, px: 0.75 }}>
                      x{group.ratio}
                    </Label>
                  )}
                </Stack>
              </Stack>
            </Box>
          )}
        </Box>

        {/* 操作按钮 */}
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            size="small"
            fullWidth
            endIcon={<Icon icon="eva:arrow-forward-outline" width={18} height={18} />}
            onClick={onViewDetail}
            sx={{
              borderRadius: '8px',
              fontSize: '0.8125rem',
              py: 0.75,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            {t('modelpricePage.viewDetail')}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

ModelCard.propTypes = {
  model: PropTypes.string.isRequired,
  provider: PropTypes.string.isRequired,
  modelInfo: PropTypes.object,
  price: PropTypes.object.isRequired,
  group: PropTypes.object,
  ownedbyIcon: PropTypes.string,
  unit: PropTypes.string,
  type: PropTypes.string,
  formatPrice: PropTypes.func,
  onViewDetail: PropTypes.func
};
