import PropTypes from 'prop-types';
import * as Yup from 'yup';
import { Formik } from 'formik';
import { useTheme } from '@mui/material/styles';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  FormHelperText,
  Select,
  Autocomplete,
  TextField,
  Checkbox,
  MenuItem
} from '@mui/material';

import { showSuccess, showError, trims } from 'utils/common';
import { API } from 'utils/api';
import { createFilterOptions } from '@mui/material/Autocomplete';
import { ValueFormatter, priceType } from './util';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const filter = createFilterOptions();
const getValidationSchema = (t) =>
  Yup.object().shape({
    is_edit: Yup.boolean(),
    type: Yup.string().oneOf(['tokens', 'times'], t('pricing_edit.typeErr')).required(t('pricing_edit.requiredType')),
    channel_type: Yup.number().min(1, t('pricing_edit.channelTypeErr')).required(t('pricing_edit.requiredChannelType')),
    input: Yup.number().required(t('pricing_edit.requiredInput')),
    output: Yup.number().required(t('pricing_edit.requiredOutput')),
    models: Yup.array().min(1, t('pricing_edit.requiredModels'))
  });

const originInputs = {
  is_edit: false,
  type: 'tokens',
  channel_type: 1,
  input: 0,
  output: 0,
  models: []
};

const EditModal = ({ open, pricesItem, onCancel, onOk, ownedby, noPriceModel }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [inputs, setInputs] = useState(originInputs);
  const [selectModel, setSelectModel] = useState([]);

  const [inputMultiplier, setInputMultiplier] = useState(0); // 美元输入价格状态
  const [outputMultiplier, setOutputMultiplier] = useState(0); // 美元输出价格状态
  const siteInfo = useSelector((state) => state.siteInfo);
  const calculateInput = (multiplier) => {
    // 根据输入的乘数计算输入价格
    return (multiplier * siteInfo.quota_per_unit) / 1000;
  };

  const calculateOutput = (multiplier) => {
    // 根据输入的乘数计算输出价格
    return (multiplier * siteInfo.quota_per_unit) / 1000;
  };

  const submit = async (values, { setErrors, setStatus, setSubmitting }) => {
    setSubmitting(true);
    values.models = trims(values.models);
    try {
      const res = await API.post(`/api/prices/multiple`, {
        original_models: inputs.models,
        models: values.models,
        price: {
          model: 'batch',
          type: values.type,
          channel_type: values.channel_type,
          input: values.input,
          output: values.output
        }
      });
      const { success, message } = res.data;
      if (success) {
        showSuccess(t('common.saveSuccess'));
        setSubmitting(false);
        setStatus({ success: true });
        onOk(true);
        return;
      } else {
        setStatus({ success: false });
        showError(message);
        setErrors({ submit: message });
      }
    } catch (error) {
      setStatus({ success: false });
      showError(error.message);
      setErrors({ submit: error.message });
      return;
    }
    onOk();
  };

  useEffect(() => {
    if (pricesItem) {
      setSelectModel(pricesItem.models.concat(noPriceModel));
    } else {
      setSelectModel(noPriceModel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pricesItem, noPriceModel]);

  useEffect(() => {
    if (pricesItem) {
      setInputs(pricesItem);
    } else {
      setInputs(originInputs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pricesItem]);

  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth={'md'}>
      <DialogTitle sx={{ margin: '0px', fontWeight: 700, lineHeight: '1.55556', padding: '24px', fontSize: '1.125rem' }}>
        {pricesItem ? t('common.edit') : t('common.create')}
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Formik initialValues={inputs} enableReinitialize validationSchema={getValidationSchema(t)} onSubmit={submit}>
          {({ errors, handleBlur, handleChange, handleSubmit, touched, values, isSubmitting }) => (
            <form noValidate onSubmit={handleSubmit}>
              <FormControl fullWidth error={Boolean(touched.type && errors.type)} sx={{ ...theme.typography.otherInput }}>
                <InputLabel htmlFor="type-label">{t('pricing_edit.name')}</InputLabel>
                <Select
                  id="type-label"
                  label={t('pricing_edit.type')}
                  value={values.type}
                  name="type"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 200
                      }
                    }
                  }}
                >
                  {Object.values(priceType).map((option) => {
                    return (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    );
                  })}
                </Select>
                {touched.type && errors.type && (
                  <FormHelperText error id="helper-tex-type-label">
                    {errors.type}
                  </FormHelperText>
                )}
              </FormControl>

              <FormControl fullWidth error={Boolean(touched.channel_type && errors.channel_type)} sx={{ ...theme.typography.otherInput }}>
                <InputLabel htmlFor="channel_type-label">{t('pricing_edit.channelType')}</InputLabel>
                <Select
                  id="channel_type-label"
                  label={t('pricing_edit.channelType')}
                  value={values.channel_type}
                  name="channel_type"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 200
                      }
                    }
                  }}
                >
                  {Object.values(ownedby).map((option) => {
                    return (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    );
                  })}
                </Select>
                {touched.channel_type && errors.channel_type && (
                  <FormHelperText error id="helper-tex-channel_type-label">
                    {errors.channel_type}
                  </FormHelperText>
                )}
              </FormControl>
              {/* 每K输入单价（美元） */}
              <FormControl fullWidth sx={{ ...theme.typography.otherInput }}>
                <InputLabel htmlFor="input-multiplier-label">{t('modelpricePage.inputPrice')}</InputLabel>
                <OutlinedInput
                  id="input-multiplier-label"
                  label={t('modelpricePage.inputPrice')}
                  type="number"
                  value={inputMultiplier}
                  endAdornment="$"
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : '';
                    setInputMultiplier(value);
                    values.input = calculateInput(value === '' ? 0 : Number(value)); // 更新输入价格
                  }}
                  onBlur={handleBlur}
                  aria-describedby="helper-text-input-multiplier-label"
                />
              </FormControl>
              {/* k输入价格*/}
              <FormControl fullWidth error={Boolean(touched.input && errors.input)} sx={{ ...theme.typography.otherInput }}>
                <InputLabel htmlFor="channel-input-label">{t('modelpricePage.inputMultiplier')}</InputLabel>
                <OutlinedInput
                  id="channel-input-label"
                  label={t('modelpricePage.inputMultiplier')}
                  type="number"
                  value={values.input}
                  name="input"
                  endAdornment={<InputAdornment position="end">{ValueFormatter(values.input)}</InputAdornment>}
                  onBlur={handleBlur}
                  onChange={handleChange}
                  aria-describedby="helper-text-channel-input-label"
                />

                {touched.input && errors.input && (
                  <FormHelperText error id="helper-tex-channel-input-label">
                    {errors.input}
                  </FormHelperText>
                )}
              </FormControl>

              {/* 每k输出单价（美元） */}
              <FormControl fullWidth sx={{ ...theme.typography.otherInput }}>
                <InputLabel htmlFor="output-multiplier-label">{t('modelpricePage.outputPrice')}</InputLabel>
                <OutlinedInput
                  id="output-multiplier-label"
                  label={t('modelpricePage.outputPrice')}
                  type="number"
                  value={outputMultiplier}
                  endAdornment="$"
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : '';
                    setOutputMultiplier(value);
                    values.output = calculateOutput(value === '' ? 0 : Number(value)); // 更新输出价格
                  }}
                  onBlur={handleBlur}
                  aria-describedby="helper-text-output-multiplier-label"
                />
              </FormControl>

              {/*k输出价格*/}
              <FormControl fullWidth error={Boolean(touched.output && errors.output)} sx={{ ...theme.typography.otherInput }}>
                <InputLabel htmlFor="channel-output-label">{t('modelpricePage.outputMultiplier')}</InputLabel>
                <OutlinedInput
                  id="channel-output-label"
                  label={t('modelpricePage.outputMultiplier')}
                  type="number"
                  value={values.output}
                  name="output"
                  endAdornment={<InputAdornment position="end">{ValueFormatter(values.output)}</InputAdornment>}
                  onBlur={handleBlur}
                  onChange={handleChange}
                  aria-describedby="helper-text-channel-output-label"
                />

                {touched.output && errors.output && (
                  <FormHelperText error id="helper-tex-channel-output-label">
                    {errors.output}
                  </FormHelperText>
                )}
              </FormControl>

              <FormControl fullWidth sx={{ ...theme.typography.otherInput }}>
                <Autocomplete
                  multiple
                  freeSolo
                  id="channel-models-label"
                  options={selectModel || []}
                  value={values.models}
                  onChange={(e, value) => {
                    const event = {
                      target: {
                        name: 'models',
                        value: value
                      }
                    };
                    handleChange(event);
                  }}
                  onBlur={handleBlur}
                  // filterSelectedOptions
                  disableCloseOnSelect
                  renderInput={(params) => (
                    <TextField {...params} name="models" error={Boolean(errors.models)} label={t('pricing_edit.model')} />
                  )}
                  filterOptions={(options, params) => {
                    const filtered = filter(options, params);
                    const { inputValue } = params;
                    const isExisting = options.some((option) => inputValue === option);
                    if (inputValue !== '' && !isExisting) {
                      filtered.push(inputValue);
                    }
                    return filtered;
                  }}
                  renderOption={(props, option, { selected }) => (
                    <li {...props}>
                      <Checkbox icon={icon} checkedIcon={checkedIcon} style={{ marginRight: 8 }} checked={selected} />
                      {option}
                    </li>
                  )}
                />
                {errors.models ? (
                  <FormHelperText error id="helper-tex-channel-models-label">
                    {errors.models}
                  </FormHelperText>
                ) : (
                  <FormHelperText id="helper-tex-channel-models-label"> {t('pricing_edit.modelTip')} </FormHelperText>
                )}
              </FormControl>

              <DialogActions>
                <Button onClick={onCancel}>{t('common.cancel')}</Button>
                <Button disableElevation disabled={isSubmitting} type="submit" variant="contained" color="primary">
                  {t('common.submit')}
                </Button>
              </DialogActions>
            </form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
};

export default EditModal;

EditModal.propTypes = {
  open: PropTypes.bool,
  // 修正后的代码
  pricesItem: PropTypes.oneOfType([PropTypes.object, PropTypes.any]),
  onCancel: PropTypes.func,
  onOk: PropTypes.func,
  ownedby: PropTypes.array,
  noPriceModel: PropTypes.array
};
