import PropTypes from 'prop-types';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Box,
  Avatar,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import { Icon } from '@iconify/react';
import Label from 'ui-component/Label';
import { MODALITY_OPTIONS } from 'constants/Modality';
import { copy } from 'utils/common';

// ----------------------------------------------------------------------

export default function ModelDetailModal({ open, onClose, model, provider, modelInfo, priceData, ownedbyIcon, userGroupMap }) {
  const theme = useTheme();

  if (!model) return null;

  // 解析模态和标签
  const getModalities = (modalitiesStr) => {
    try {
      return JSON.parse(modalitiesStr || '[]');
    } catch (e) {
      return [];
    }
  };

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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: '16px',
          backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.95) : theme.palette.background.paper
        }
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            {ownedbyIcon && (
              <Avatar
                src={ownedbyIcon}
                alt={provider}
                sx={{
                  width: 48,
                  height: 48,
                  backgroundColor: theme.palette.mode === 'dark' ? '#fff' : theme.palette.background.paper,
                  '.MuiAvatar-img': {
                    objectFit: 'contain',
                    padding: '6px'
                  }
                }}
              >
                {provider?.charAt(0).toUpperCase()}
              </Avatar>
            )}
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 600, mb: 0.5 }}>
                {modelInfo?.name || model}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                  {model}
                </Typography>
                <IconButton size="small" onClick={() => copy(model, '模型标识')} sx={{ p: 0.5 }}>
                  <Icon icon="eva:copy-outline" width={16} height={16} />
                </IconButton>
              </Stack>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            {priceData?.price?.type === 'tokens' && <Chip label="按Token收费" size="small" color="success" sx={{ fontWeight: 600 }} />}
            {tags.includes('Hot') && <Chip label="Hot" size="small" color="error" sx={{ fontWeight: 600 }} />}
            <IconButton onClick={onClose} sx={{ ml: 1 }}>
              <Icon icon="eva:close-outline" width={24} height={24} />
            </IconButton>
          </Stack>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        {/* 模型描述 */}
        {modelInfo?.description && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              {modelInfo.description}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* 模型信息 */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Icon icon="eva:info-outline" width={20} height={20} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              模型信息
            </Typography>
          </Stack>

          <Stack spacing={2}>
            {/* 类型 */}
            <Stack direction="row" alignItems="center" spacing={2}>
              <Icon icon="eva:cube-outline" width={18} height={18} color={theme.palette.text.secondary} />
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                类型:
              </Typography>
              <Label color="primary" variant="soft">
                {priceData?.price?.type === 'tokens' ? '按Token收费' : '按次数收费'}
              </Label>
            </Stack>

            {/* 上下文长度 */}
            {modelInfo?.context_length && (
              <Stack direction="row" alignItems="center" spacing={2}>
                <Icon icon="eva:file-text-outline" width={18} height={18} color={theme.palette.text.secondary} />
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                  上下文长度:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {modelInfo.context_length.toLocaleString()}
                </Typography>
              </Stack>
            )}

            {/* 最大Tokens */}
            {modelInfo?.max_tokens && (
              <Stack direction="row" alignItems="center" spacing={2}>
                <Icon icon="eva:maximize-outline" width={18} height={18} color={theme.palette.text.secondary} />
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                  最大tokens:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {modelInfo.max_tokens.toLocaleString()}
                </Typography>
              </Stack>
            )}

            {/* 输入模态 */}
            {inputModalities.length > 0 && (
              <Stack direction="row" alignItems="center" spacing={2}>
                <Icon icon="eva:arrow-down-outline" width={18} height={18} color={theme.palette.text.secondary} />
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                  输入模态:
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {inputModalities.map((modality, index) => (
                    <Label key={index} variant="soft" color={MODALITY_OPTIONS[modality]?.color || 'primary'}>
                      {MODALITY_OPTIONS[modality]?.text || modality}
                    </Label>
                  ))}
                </Stack>
              </Stack>
            )}

            {/* 输出模态 */}
            {outputModalities.length > 0 && (
              <Stack direction="row" alignItems="center" spacing={2}>
                <Icon icon="eva:arrow-up-outline" width={18} height={18} color={theme.palette.text.secondary} />
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                  输出模态:
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {outputModalities.map((modality, index) => (
                    <Label key={index} variant="soft" color={MODALITY_OPTIONS[modality]?.color || 'secondary'}>
                      {MODALITY_OPTIONS[modality]?.text || modality}
                    </Label>
                  ))}
                </Stack>
              </Stack>
            )}

            {/* 标签 */}
            {tags.length > 0 && (
              <Stack direction="row" alignItems="center" spacing={2}>
                <Icon icon="eva:pricetags-outline" width={18} height={18} color={theme.palette.text.secondary} />
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                  标签:
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {tags.map((tag, index) => (
                    <Chip key={index} label={tag} size="small" />
                  ))}
                </Stack>
              </Stack>
            )}
          </Stack>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* 价格明细 */}
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Icon icon="eva:pricetags-outline" width={20} height={20} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              价格明细
            </Typography>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
            不同分组,主要是根据对应的渠道来源不同,对应的价格也随之不同,渠道组需要在令牌管理中切换。
          </Typography>

          {/* 等级标签 */}
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              等级:
            </Typography>
            {Object.entries(userGroupMap || {}).map(([key, group]) => {
              let tierLabel = 'Free';
              if (group.ratio > 0) {
                if (group.ratio < 1) tierLabel = `Tier 1`;
                else if (group.ratio < 2) tierLabel = `Tier 2`;
                else tierLabel = `Tier 3`;
              }
              const discount = group.ratio > 1 ? ` ${((group.ratio - 1) * 10).toFixed(0)} 折` : '';
              return (
                <Chip
                  key={key}
                  label={`${tierLabel}${discount}`}
                  size="small"
                  color={group.ratio === 0 ? 'default' : group.ratio > 1 ? 'warning' : 'success'}
                  sx={{ fontWeight: 500 }}
                />
              );
            })}
          </Stack>

          {/* 价格表格 */}
          <TableContainer
            sx={{
              border: `1px solid ${theme.palette.mode === 'dark' ? alpha('#fff', 0.08) : alpha('#000', 0.08)}`,
              borderRadius: '8px',
              overflow: 'hidden'
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.mode === 'dark' ? alpha('#fff', 0.05) : alpha('#000', 0.02) }}>
                  <TableCell sx={{ fontWeight: 600 }}>渠道组</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>输入</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>输出</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>其他价格</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {priceData?.allGroupPrices?.map((groupPrice, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Label color="primary" variant="soft">
                        {groupPrice.groupName}
                      </Label>
                    </TableCell>
                    <TableCell>
                      <Label color="success" variant="outlined">
                        ${groupPrice.input}
                      </Label>
                    </TableCell>
                    <TableCell>
                      <Label color="warning" variant="outlined">
                        ${groupPrice.output}
                      </Label>
                    </TableCell>
                    <TableCell>
                      {groupPrice.extraRatios ? (
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                          {Object.entries(groupPrice.extraRatios).map(([key, value]) => (
                            <Label key={key} variant="outlined" color="info" sx={{ fontSize: '0.7rem' }}>
                              {key}: ${value}
                            </Label>
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          缓存
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* 其他信息 */}
        {priceData?.price?.extra_ratios && Object.keys(priceData.price.extra_ratios).length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Icon icon="eva:bar-chart-outline" width={20} height={20} />
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                其他信息
              </Typography>
            </Stack>
            <Stack spacing={1}>
              {Object.entries(priceData.price.extra_ratios).map(([key, value]) => (
                <Stack key={key} direction="row" alignItems="center" spacing={2}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                    {key}:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {value}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

ModelDetailModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  model: PropTypes.string,
  provider: PropTypes.string,
  modelInfo: PropTypes.object,
  priceData: PropTypes.object,
  ownedbyIcon: PropTypes.string,
  userGroupMap: PropTypes.object
};
