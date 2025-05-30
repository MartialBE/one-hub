import { Box, Typography, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { renderQuota } from 'utils/common';
import PropTypes from 'prop-types';

// Helper function to calculate the original quota based on actual price and group ratio
export function calculateOriginalQuota(item) {
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

  // Return the calculated original quota or the metadata value if the calculation is 0
  return calculatedOriginalQuota || item.metadata?.original_quota || item.metadata?.origin_quota || 0;
}

// QuotaWithDetailRow is only responsible for the price in the main row and the small triangle
export default function QuotaWithDetailRow({ item, open, setOpen }) {
  // Calculate the original quota based on the formula
  const originalQuota = calculateOriginalQuota(item);
  // Ensure quota has a fallback value
  const quota = item.quota || 0;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box onClick={() => setOpen((o) => !o)} sx={{ display: 'flex', flexDirection: 'column', mr: 1, cursor: 'pointer' }}>
        <Typography
          variant="caption"
          sx={{
            color: (theme) => theme.palette.text.secondary,
            textDecoration: 'line-through',
            fontSize: 12
          }}
        >
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

QuotaWithDetailRow.propTypes = {
  item: PropTypes.shape({
    quota: PropTypes.number,
    metadata: PropTypes.shape({
      group_ratio: PropTypes.number,
      original_quota: PropTypes.number,
      origin_quota: PropTypes.number
    })
  }).isRequired,
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired
};
