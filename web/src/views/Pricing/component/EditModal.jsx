import PropTypes from 'prop-types';
import * as Yup from 'yup';
import { Formik } from 'formik';
import { useTheme } from '@mui/material/styles';
import { useState, useEffect, useCallback } from 'react';
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
  MenuItem,
  Stack,
  Alert,
  Paper,
  Typography
} from '@mui/material';

import { showSuccess, showError, trims } from 'utils/common';
import { API } from 'utils/api';
import { createFilterOptions } from '@mui/material/Autocomplete';
import { ValueFormatter, priceType } from './util';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { useTranslation } from 'react-i18next';
import ToggleButtonGroup from 'ui-component/ToggleButton';
import Decimal from 'decimal.js';
import { ExtraRatiosSelector } from './ExtraRatiosSelector';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const filter = createFilterOptions();

// 单一模式下的表单验证
const validateSingleMode = (t, values, rows) => {
  if (values.model === '') {
    return t('pricing_edit.requiredModelName');
  }

  if (values.type !== 'tokens' && values.type !== 'times') {
    return t('pricing_edit.typeCheck');
  }

  if (values.channel_type <= 0) {
    return t('pricing_edit.channelTypeErr2');
  }

  // 判断model是否是唯一值
  if (rows && rows.filter((r) => r.model === values.model && (values.isNew || r.id !== values.id)).length > 0) {
    return t('pricing_edit.modelNameRe');
  }

  if (values.input === '' || values.input < 0) {
    return t('pricing_edit.inputVal');
  }
  if (values.output === '' || values.output < 0) {
    return t('pricing_edit.outputVal');
  }
  return false;
};

// 多选模式下的表单验证
const getValidationSchema = (t) =>
  Yup.object().shape({
    is_edit: Yup.boolean(),
    type: Yup.string().oneOf(['tokens', 'times'], t('pricing_edit.typeErr')).required(t('pricing_edit.requiredType')),
    channel_type: Yup.number().min(1, t('pricing_edit.channelTypeErr')).required(t('pricing_edit.requiredChannelType')),
    input: Yup.number().required(t('pricing_edit.requiredInput')),
    output: Yup.number().required(t('pricing_edit.requiredOutput')),
    models: Yup.array().min(1, t('pricing_edit.requiredModels'))
  });

// 多选模式初始值
const multipleOriginInputs = {
  is_edit: false,
  type: 'tokens',
  channel_type: 1,
  input: 0,
  output: 0,
  locked: false,
  models: [],
  extra_ratios: {}
};

// 单一模式初始值
const singleOriginInputs = {
  model: '',
  type: 'tokens',
  channel_type: 1,
  input: 0,
  output: 0,
  locked: false,
  extra_ratios: {}
};

const EditModal = ({
  open,
  pricesItem,
  onCancel,
  onOk,
  ownedby,
  noPriceModel,
  singleMode = false,
  price = null,
  rows = [],
  onSaveSingle = null,
  unit = 'K'
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [inputs, setInputs] = useState(singleMode ? singleOriginInputs : multipleOriginInputs);
  const [selectModel, setSelectModel] = useState([]);
  const [errors, setErrors] = useState({});

  const [unitType, setUnitType] = useState('rate');
  const [localUnit, setLocalUnit] = useState(unit);

  // 当外部unit变化时同步本地unit
  useEffect(() => {
    setLocalUnit(unit);
  }, [unit]);

  const calculateRate = useCallback(
    (price) => {
      if (price === '') {
        return 0;
      }
      if (unitType === 'rate') {
        return price;
      }

      let priceValue = new Decimal(price);

      if (localUnit === 'M') {
        priceValue = priceValue.div(1000);
      }

      switch (unitType) {
        case 'USD':
          priceValue = priceValue.div(0.002);
          break;
        case 'RMB':
          priceValue = priceValue.div(0.014);
          break;
      }

      return Number(priceValue.toFixed(4));
    },
    [unitType, localUnit]
  );

  const unitTypeOptions = [
    { value: 'rate', label: t('modelpricePage.rate') },
    { value: 'USD', label: 'USD' },
    { value: 'RMB', label: 'RMB' }
  ];

  const lockedOptions = [
    { value: true, label: t('pricing_edit.locked') },
    { value: false, label: t('pricing_edit.unlocked') }
  ];

  const unitOptions = [
    { value: 'K', label: 'K' },
    { value: 'M', label: 'M' }
  ];

  const handleEndAdornment = useCallback(
    (value) => {
      let endAdornment = '';

      switch (unitType) {
        case 'rate':
          endAdornment = ValueFormatter(value);
          break;
        case 'USD':
        case 'RMB':
          endAdornment = value === 0 ? 'Free' : calculateRate(value) + ' Rate';
          break;
      }

      return endAdornment;
    },
    [unitType, calculateRate]
  );

  const handleStartAdornment = useCallback(() => {
    switch (unitType) {
      case 'rate':
        return 'Rate：';
      case 'USD':
        return `USD(${localUnit})：`;
      case 'RMB':
        return `RMB(${localUnit})：`;
    }
  }, [unitType, localUnit]);

  // 表单提交处理
  const submit = async (values, { setErrors, setStatus, setSubmitting }) => {
    setSubmitting(true);

    // 单一模式处理
    if (singleMode) {
      // 验证表单
      const validationError = validateSingleMode(t, values, rows);
      if (validationError) {
        setStatus({ success: false });
        setErrors({ submit: validationError });
        return;
      }

      try {
        if (onSaveSingle) {
          await onSaveSingle({
            ...values,
            input: calculateRate(values.input),
            output: calculateRate(values.output)
          });
        }
        setSubmitting(false);
        return;
      } catch (error) {
        setStatus({ success: false });
        setErrors({ submit: error.message });
        return;
      }
    }

    // 多选模式处理
    values.models = trims(values.models);
    try {
      const res = await API.post(`/api/prices/multiple`, {
        original_models: inputs.models,
        models: values.models,
        price: {
          model: 'batch',
          type: values.type,
          channel_type: values.channel_type,
          input: calculateRate(values.input),
          output: calculateRate(values.output),
          locked: values.locked,
          extra_ratios: values.extra_ratios
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

  // 处理表单字段变化 (单模式用)
  const handleChange = (event) => {
    if (!singleMode) return; // 单一模式专用

    const { name, value, checked } = event.target;
    setInputs((prev) => ({
      ...prev,
      [name]: name === 'locked' ? checked : value
    }));

    // 清除对应字段的错误
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // 处理extra_ratios变化 (单模式用)
  const handleChangeExtraRatios = (newExtraRatios) => {
    if (!singleMode) return; // 单一模式专用

    setInputs((prev) => ({
      ...prev,
      extra_ratios: newExtraRatios
    }));
  };

  useEffect(() => {
    if (singleMode) {
      // 单一模式初始化表单
      if (price) {
        setInputs({
          ...price,
          extra_ratios: price.extra_ratios || {}
        });
      } else {
        setInputs(singleOriginInputs);
      }
      setErrors({});
    } else {
      // 多选模式初始化
      if (pricesItem) {
        setSelectModel(pricesItem.models.concat(noPriceModel));
        setInputs(pricesItem);
      } else {
        setSelectModel(noPriceModel);
        setInputs(multipleOriginInputs);
      }
    }
  }, [singleMode, price, pricesItem, noPriceModel]);

  useEffect(() => {
    if (open) {
      setUnitType('rate');
      setLocalUnit('K');
    }
  }, [open]);

  // 渲染类型选择表单
  const renderTypeSelector = (formProps) => {
    const { errors = {}, touched = {}, handleBlur, handleChange, values = {} } = formProps || {};

    return (
      <FormControl
        fullWidth
        error={singleMode ? !!errors.type : Boolean(touched?.type && errors?.type)}
        sx={{ ...theme.typography.otherInput }}
      >
        <InputLabel htmlFor="type-label">{t('pricing_edit.type')}</InputLabel>
        <Select
          id="type-label"
          label={t('pricing_edit.type')}
          value={singleMode ? inputs.type : values?.type}
          name="type"
          onBlur={handleBlur}
          onChange={singleMode ? handleChange : handleChange}
          MenuProps={{
            PaperProps: {
              style: {
                maxHeight: 200
              }
            }
          }}
        >
          {Object.values(priceType).map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {!singleMode && touched?.type && errors?.type && (
          <FormHelperText error id="helper-tex-type-label">
            {errors.type}
          </FormHelperText>
        )}
      </FormControl>
    );
  };

  // 渲染渠道类型选择表单
  const renderChannelTypeSelector = (formProps) => {
    const { errors = {}, touched = {}, handleBlur, handleChange, values = {} } = formProps || {};

    return (
      <FormControl
        fullWidth
        error={singleMode ? !!errors.channel_type : Boolean(touched?.channel_type && errors?.channel_type)}
        sx={{ ...theme.typography.otherInput }}
      >
        <InputLabel htmlFor="channel_type-label">{t('pricing_edit.channelType')}</InputLabel>
        <Select
          id="channel_type-label"
          label={t('pricing_edit.channelType')}
          value={singleMode ? inputs.channel_type : values?.channel_type}
          name="channel_type"
          onBlur={handleBlur}
          onChange={singleMode ? handleChange : handleChange}
          MenuProps={{
            PaperProps: {
              style: {
                maxHeight: 200
              }
            }
          }}
        >
          {ownedby.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {!singleMode && touched?.channel_type && errors?.channel_type && (
          <FormHelperText error id="helper-tex-channel_type-label">
            {errors.channel_type}
          </FormHelperText>
        )}
      </FormControl>
    );
  };

  // 渲染单位类型切换按钮组
  const renderUnitTypeToggle = () => (
    <FormControl fullWidth sx={{ ...theme.typography.otherInput }}>
      <Stack direction="row" spacing={2}>
        <ToggleButtonGroup
          value={unitType}
          onChange={(event, newUnitType) => {
            setUnitType(newUnitType);
          }}
          options={unitTypeOptions}
          aria-label="unit toggle"
        />

        <ToggleButtonGroup
          value={localUnit}
          onChange={(event, newUnit) => {
            setLocalUnit(newUnit);
          }}
          options={unitOptions}
          aria-label="unit toggle"
        />
      </Stack>
    </FormControl>
  );

  // 渲染输入价格表单
  const renderInputField = (formProps) => {
    const { errors = {}, touched = {}, handleBlur, handleChange: formikHandleChange, values = {} } = formProps || {};

    // 根据模式选择正确的处理函数和值
    const value = singleMode ? inputs.input : values.input;
    const onChange = singleMode ? handleChange : formikHandleChange;
    const errorState = singleMode ? !!errors.input : Boolean(touched?.input && errors?.input);

    return (
      <FormControl fullWidth error={errorState} sx={{ ...theme.typography.otherInput }}>
        <InputLabel htmlFor="channel-input-label">{t('modelpricePage.inputMultiplier')}</InputLabel>
        <OutlinedInput
          id="channel-input-label"
          label={t('modelpricePage.inputMultiplier')}
          type="number"
          value={value}
          name="input"
          startAdornment={<InputAdornment position="start">{handleStartAdornment()}</InputAdornment>}
          endAdornment={<InputAdornment position="end">{handleEndAdornment(value)}</InputAdornment>}
          onBlur={handleBlur}
          onChange={onChange}
          aria-describedby="helper-text-channel-input-label"
        />

        {(singleMode && errors.input) || (!singleMode && touched?.input && errors?.input) ? (
          <FormHelperText error id="helper-tex-channel-input-label">
            {errors.input}
          </FormHelperText>
        ) : null}
      </FormControl>
    );
  };

  // 渲染输出价格表单
  const renderOutputField = (formProps) => {
    const { errors = {}, touched = {}, handleBlur, handleChange: formikHandleChange, values = {} } = formProps || {};

    // 根据模式选择正确的处理函数和值
    const value = singleMode ? inputs.output : values.output;
    const onChange = singleMode ? handleChange : formikHandleChange;
    const errorState = singleMode ? !!errors.output : Boolean(touched?.output && errors?.output);

    return (
      <FormControl fullWidth error={errorState} sx={{ ...theme.typography.otherInput }}>
        <InputLabel htmlFor="channel-output-label">{t('modelpricePage.outputMultiplier')}</InputLabel>
        <OutlinedInput
          id="channel-output-label"
          label={t('modelpricePage.outputMultiplier')}
          type="number"
          value={value}
          name="output"
          startAdornment={<InputAdornment position="start">{handleStartAdornment()}</InputAdornment>}
          endAdornment={<InputAdornment position="end">{handleEndAdornment(value)}</InputAdornment>}
          onBlur={handleBlur}
          onChange={onChange}
          aria-describedby="helper-text-channel-output-label"
        />

        {(singleMode && errors.output) || (!singleMode && touched?.output && errors?.output) ? (
          <FormHelperText error id="helper-tex-channel-output-label">
            {errors.output}
          </FormHelperText>
        ) : null}
      </FormControl>
    );
  };

  // 渲染锁定切换按钮组
  const renderLockedToggle = (formProps) => {
    const { handleChange: formikHandleChange, values = {} } = formProps || {};

    // 在单模式下，我们需要使用不同的处理方式
    const handleLockChange = (event, newLocked) => {
      if (singleMode) {
        // 在单模式下，直接更新inputs状态
        handleChange({
          target: {
            name: 'locked',
            checked: newLocked
          }
        });
      } else {
        // 在多模式下，使用Formik的handleChange
        formikHandleChange({
          target: {
            name: 'locked',
            value: newLocked
          }
        });
      }
    };

    return (
      <FormControl fullWidth sx={{ ...theme.typography.otherInput }}>
        <Stack direction="row" spacing={2}>
          <ToggleButtonGroup
            value={singleMode ? inputs.locked : values?.locked}
            onChange={handleLockChange}
            options={lockedOptions}
            aria-label="locked toggle"
          />
        </Stack>
      </FormControl>
    );
  };

  // 渲染额外比率选择器
  const renderExtraRatioSelector = (formProps) => {
    const { setFieldValue, values = {} } = formProps || {};

    if (singleMode) {
      return (
        <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
          <ExtraRatiosSelector value={inputs.extra_ratios} onChange={handleChangeExtraRatios} />
        </Paper>
      );
    }

    return (
      <FormControl fullWidth sx={{ ...theme.typography.otherInput }}>
        <ExtraRatiosSelector
          value={values.extra_ratios || {}}
          onChange={(newExtraRatios) => {
            setFieldValue('extra_ratios', newExtraRatios);
          }}
          handleStartAdornment={handleStartAdornment}
        />
      </FormControl>
    );
  };

  // 渲染模型选择器 (多模式特有)
  const renderModelSelector = (formProps) => {
    if (!formProps) return null;

    const { errors = {}, handleBlur, handleChange, values = {} } = formProps;

    return (
      <FormControl fullWidth sx={{ ...theme.typography.otherInput }}>
        <Autocomplete
          multiple
          freeSolo
          id="channel-models-label"
          options={selectModel || []}
          value={values.models || []}
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
          disableCloseOnSelect
          getOptionLabel={(option) => option || ''}
          renderInput={(params) => <TextField {...params} name="models" error={Boolean(errors.models)} label={t('pricing_edit.model')} />}
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
    );
  };

  // 渲染操作按钮
  const renderActions = (formProps) => {
    const { isSubmitting = false } = formProps || {};

    return (
      <DialogActions>
        <Button onClick={onCancel}>{t('common.cancel')}</Button>
        {singleMode ? (
          <Button
            onClick={() =>
              submit(inputs, {
                setErrors,
                setStatus: () => {},
                setSubmitting: () => {}
              })
            }
            variant="contained"
            color="primary"
          >
            {t('common.submit')}
          </Button>
        ) : (
          <Button disableElevation disabled={isSubmitting} type="submit" variant="contained" color="primary">
            {t('common.submit')}
          </Button>
        )}
      </DialogActions>
    );
  };

  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth="md">
      <DialogTitle sx={{ margin: '0px', fontWeight: 700, lineHeight: '1.55556', padding: '24px', fontSize: '1.125rem' }}>
        {singleMode ? (price ? t('common.edit') : t('common.create')) : pricesItem ? t('common.edit') : t('common.create')}
      </DialogTitle>
      <Divider />
      <DialogContent>
        {singleMode ? (
          // 单一模式表单
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={t('pricing_edit.name')}
              name="model"
              value={inputs.model}
              onChange={handleChange}
              fullWidth
              error={!!errors.model}
              helperText={errors.model}
            />

            {renderTypeSelector()}
            {renderChannelTypeSelector()}
            {renderUnitTypeToggle()}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {renderInputField()}
              {renderOutputField()}
            </Stack>

            {renderLockedToggle()}
            <Alert severity="warning">{t('pricing_edit.lockedTip')}</Alert>

            {renderExtraRatioSelector()}

            {errors.general && (
              <Typography color="error" variant="body2">
                {errors.general}
              </Typography>
            )}

            {renderActions()}
          </Stack>
        ) : (
          // 多选模式表单
          <Formik initialValues={inputs} enableReinitialize validationSchema={getValidationSchema(t)} onSubmit={submit}>
            {(formProps) => (
              <form noValidate onSubmit={formProps.handleSubmit}>
                {renderTypeSelector(formProps)}
                {renderChannelTypeSelector(formProps)}
                {renderUnitTypeToggle()}
                {renderInputField(formProps)}
                {renderOutputField(formProps)}
                {renderModelSelector(formProps)}
                {renderLockedToggle(formProps)}
                <Alert severity="warning">{t('pricing_edit.lockedTip')}</Alert>
                {renderExtraRatioSelector(formProps)}
                {renderActions(formProps)}
              </form>
            )}
          </Formik>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditModal;

EditModal.propTypes = {
  open: PropTypes.bool,
  pricesItem: PropTypes.oneOfType([PropTypes.object, PropTypes.any]),
  onCancel: PropTypes.func,
  onOk: PropTypes.func,
  ownedby: PropTypes.array,
  noPriceModel: PropTypes.array,
  // 以下是单一模式专用
  singleMode: PropTypes.bool,
  price: PropTypes.object,
  rows: PropTypes.array,
  onSaveSingle: PropTypes.func,
  unit: PropTypes.string
};
