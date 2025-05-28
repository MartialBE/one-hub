import { Box, Typography } from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PercentIcon from '@mui/icons-material/Percent';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import CalculateIcon from '@mui/icons-material/Calculate';
import Decimal from 'decimal.js';
import { renderQuota } from 'utils/common';
import { calculateOriginalQuota } from './QuotaWithDetailRow';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

// Function to calculate price
export function calculatePrice(ratio, groupDiscount, isTimes) {
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

// QuotaWithDetailContent is responsible for rendering the detailed content
export default function QuotaWithDetailContent({ item }) {
  const { t } = useTranslation();
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
    item.metadata?.input_price || (item.metadata?.input_ratio ? `$${calculatePrice(item.metadata.input_ratio, groupRatio, false)} ` : '$0');
  const outputPrice =
    item.metadata?.output_price ||
    (item.metadata?.output_ratio ? `$${calculatePrice(item.metadata.output_ratio, groupRatio, false)}` : '$0');

  const inputPriceUnit = inputPrice + ' /M';
  const outputPriceUnit = outputPrice + ' /M';

  const inputTokens = item.prompt_tokens || 0;
  const outputTokens = item.completion_tokens || 0;

  // Create a calculation explanation string
  const stepStr = `(${inputTokens} / 1,000,000 * ${inputPrice})${outputTokens > 0 ? ` + (${outputTokens} / 1,000,000 * ${outputPrice})` : ''} = ${renderQuota(quota, 6)}`;

  let savePercent = '';
  if (originalQuota > 0 && quota > 0) {
    savePercent = `${t('logPage.quotaDetail.saved')}${((1 - quota / originalQuota) * 100).toFixed(0)}%`;
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
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}
    >
      {/* 上方三栏 */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          '&::-webkit-scrollbar': {
            height: '6px'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: (theme) => theme.palette.divider,
            borderRadius: '3px'
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent'
          }
        }}
      >
        {/* 原始价格 */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            p: 2,
            borderRadius: 1,
            background: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.default : '#fafbfc')
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <AttachMoneyIcon sx={{ fontSize: 20, mr: 1, color: (theme) => theme.palette.info.main }} />
            <Typography sx={{ fontWeight: 600, fontSize: 15 }}>{t('logPage.quotaDetail.originalPrice')}</Typography>
          </Box>
          <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary, mb: 0.5, textAlign: 'left' }}>
            {t('logPage.quotaDetail.inputPrice')}: {originalInputPrice}
          </Typography>
          <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary, textAlign: 'left' }}>
            {t('logPage.quotaDetail.outputPrice')}: {originalOutputPrice}
          </Typography>
        </Box>
        {/* Group Ratio */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            p: 2,
            borderRadius: 1,
            background: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.default : '#fafbfc')
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <PercentIcon sx={{ fontSize: 20, mr: 1, color: (theme) => theme.palette.info.main }} />
            <Typography sx={{ fontWeight: 600, fontSize: 15 }}>{t('logPage.quotaDetail.groupRatio')}</Typography>
          </Box>
          <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary, textAlign: 'left' }}>
            {t('logPage.groupLabel')}: {item.metadata?.group_name}
          </Typography>
          <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary, textAlign: 'left' }}>
            {t('logPage.quotaDetail.groupRatioValue')}: {groupRatio}
          </Typography>
        </Box>
        {/* Actual Price */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            p: 2,
            borderRadius: 1,
            background: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.default : '#fafbfc')
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <CreditCardIcon sx={{ fontSize: 20, mr: 1, color: (theme) => theme.palette.primary.main }} />
            <Typography sx={{ fontWeight: 600, fontSize: 15 }}>{t('logPage.quotaDetail.actualPrice')}</Typography>
          </Box>
          <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary, mb: 0.5, textAlign: 'left' }}>
            {t('logPage.quotaDetail.input')}: {inputPriceUnit}
          </Typography>
          <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary, textAlign: 'left' }}>
            {t('logPage.quotaDetail.output')}: {outputPriceUnit}
          </Typography>
        </Box>
      </Box>
      {/* Final Calculation Area */}
      <Box
        sx={{
          p: 2,
          borderRadius: 1,
          background: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.default : '#f7f8fa')
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <CalculateIcon sx={{ fontSize: 20, mr: 1, color: (theme) => theme.palette.success.main }} />
          <Typography sx={{ fontWeight: 600, fontSize: 15 }}>{t('logPage.quotaDetail.finalCalculation')}</Typography>
        </Box>
        <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary, mb: 1, textAlign: 'left' }}>{stepStr}</Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, mb: 1 }}>
          <Typography
            sx={{
              fontSize: 13,
              color: (theme) => theme.palette.text.secondary,
              mr: 2,
              mb: { xs: 0.5, sm: 0 },
              textAlign: 'left'
            }}
          >
            {t('logPage.quotaDetail.originalBilling')}: {renderQuota(originalQuota, 6)}
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
            {t('logPage.quotaDetail.actualBilling')}: {renderQuota(quota, 6)}
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
          {t('logPage.quotaDetail.calculationNote')}
        </Typography>
      </Box>
    </Box>
  );
}

QuotaWithDetailContent.propTypes = {
  item: PropTypes.shape({
    quota: PropTypes.number,
    prompt_tokens: PropTypes.number,
    completion_tokens: PropTypes.number,
    metadata: PropTypes.shape({
      input_price_origin: PropTypes.string,
      output_price_origin: PropTypes.string,
      input_ratio: PropTypes.number,
      output_ratio: PropTypes.number,
      group_ratio: PropTypes.number,
      group_name: PropTypes.string,
      input_price: PropTypes.string,
      output_price: PropTypes.string,
      original_quota: PropTypes.number,
      origin_quota: PropTypes.number
    })
  }).isRequired
};
