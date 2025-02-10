import { styled } from '@mui/material';
import { ToggleButton, ToggleButtonGroup as MuiToggleButtonGroup } from '@mui/material';
import PropTypes from 'prop-types';

const StyledToggleButtonGroup = styled(MuiToggleButtonGroup)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: '8px',
  padding: '2px',
  '& .MuiToggleButton-root': {
    border: 'none',
    borderRadius: '6px',
    padding: '4px 12px',
    fontSize: '13px',
    fontWeight: 500,
    color: theme.palette.text.secondary,
    '&:hover': {
      backgroundColor: theme.palette.action.hover
    },
    '&.Mui-selected': {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.common.white,
      '&:hover': {
        backgroundColor: theme.palette.primary.dark
      }
    }
  }
}));

const StyledToggleButton = styled(ToggleButton)({
  '&.MuiToggleButton-root': {
    textTransform: 'none',
    minWidth: '36px',
    transition: 'all 0.2s ease-in-out'
  }
});

export default function ToggleButtonGroup({
  value,
  onChange,
  options = [],
  size = 'small',
  exclusive = true,
  'aria-label': ariaLabel,
  ...other
}) {
  const handleChange = (event, newValue) => {
    if (newValue !== null) {
      onChange(event, newValue);
    }
  };

  return (
    <StyledToggleButtonGroup value={value} exclusive={exclusive} onChange={handleChange} size={size} aria-label={ariaLabel} {...other}>
      {options.map((option) => (
        <StyledToggleButton key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </StyledToggleButton>
      ))}
    </StyledToggleButtonGroup>
  );
}

ToggleButtonGroup.propTypes = {
  value: PropTypes.any,
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.any.isRequired,
      label: PropTypes.node.isRequired,
      disabled: PropTypes.bool
    })
  ),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  exclusive: PropTypes.bool,
  'aria-label': PropTypes.string
};
