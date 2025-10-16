import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { useFormikContext } from 'formik';
import { Autocomplete, Box, Chip, FormControl, FormHelperText, Grid, Paper, TextField, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import { useMemo } from 'react';

const ModelLimitSelector = ({ modelOptions, getModelIcon }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { values, setFieldValue } = useFormikContext();
  const sortedModelOptions = useMemo(() => {
    return [...modelOptions].sort((a, b) => a.owned_by.localeCompare(b.owned_by));
  }, [modelOptions]);

  const selectedValue = useMemo(() => {
    const selectedIds = new Set(values.setting?.limits?.limit_model_setting?.models || []);
    return modelOptions.filter((option) => selectedIds.has(option.id));
  }, [values.setting?.limits?.limit_model_setting?.models, modelOptions]);

  return (
    <FormControl fullWidth sx={{ ...theme.typography.otherInput }}>
      <Autocomplete
        multiple
        disableListWrap
        options={sortedModelOptions}
        groupBy={(option) => option.owned_by}
        value={selectedValue}
        onChange={(event, newValue) => {
          const modelIds = newValue.map((option) => option.id);
          setFieldValue('setting.limits.limit_model_setting.models', modelIds);
        }}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        getOptionLabel={(option) => option.name || ''}
        ListboxProps={{
          style: {
            maxHeight: '400px'
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={t('token_index.limit_models')}
            placeholder={values.setting?.limits?.limit_model_setting?.models?.length > 0 ? '' : t('token_index.limit_models_info')}
          />
        )}
        renderOption={(props, option) => (
          <Box component="li" {...props} key={option.id} sx={{ alignItems: 'flex-start' }}>
            <Grid container spacing={1} sx={{ alignItems: 'center' }}>
              <Grid item xs={'auto'}>
                <img
                  src={getModelIcon(option.owned_by)}
                  alt={option.owned_by}
                  style={{ width: 24, height: 24, borderRadius: '4px' }}
                  onError={(e) => {
                    e.target.src = '/src/assets/images/icons/unknown_type.svg';
                  }}
                />
              </Grid>
              <Grid item xs>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {option.name}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  {option.groups.map((group) => (
                    <Chip key={group} label={group} size="small" variant="outlined" />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => {
            const { key, ...otherTagProps } = getTagProps({ index });
            return (
              <Chip
                key={key}
                label={option.name}
                {...otherTagProps}
                size="small"
                variant="outlined"
                color="primary"
                sx={{
                  margin: 1,
                  color: theme.palette.primary.main,
                  '& .MuiChip-deleteIcon': {
                    color: theme.palette.primary.main,
                    transition: 'color 0.2s ease-in-out'
                  },
                  '& .MuiChip-deleteIcon:hover': {
                    color: theme.palette.primary.main
                  }
                }}
              />
            );
          })
        }
        PaperComponent={(props) => (
          <Paper
            {...props}
            style={{
              boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
              borderRadius: '8px'
            }}
          />
        )}
        disableCloseOnSelect
      />
      <FormHelperText>{t('token_index.limit_models_info')}</FormHelperText>
    </FormControl>
  );
};

export default ModelLimitSelector;

ModelLimitSelector.propTypes = {
  modelOptions: PropTypes.array,
  getModelIcon: PropTypes.func
};
