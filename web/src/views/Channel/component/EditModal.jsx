import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { CHANNEL_OPTIONS } from 'constants/ChannelConstants';
import { useTheme } from '@mui/material/styles';
import { API } from 'utils/api';
import { showError, showSuccess, trims } from 'utils/common';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  OutlinedInput,
  ButtonGroup,
  Container,
  Autocomplete,
  FormHelperText,
  Checkbox,
  Switch,
  FormControlLabel,
  Typography,
  Tooltip,
  Chip
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import { Formik } from 'formik';
import * as Yup from 'yup';
import { defaultConfig, typeConfig } from '../type/Config'; //typeConfig
import { createFilterOptions } from '@mui/material/Autocomplete';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { useTranslation } from 'react-i18next';
import useCustomizeT from 'hooks/useCustomizeT';

import { PreCostType } from '../type/other';
import ModelMappingInput from './ModelMappingInput';
import ModelHeadersInput from './ModelHeadersInput';

import pluginList from '../type/Plugin.json';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const filter = createFilterOptions();
const getValidationSchema = (t) =>
  Yup.object().shape({
    is_edit: Yup.boolean(),
    // is_tag: Yup.boolean(),
    name: Yup.string().required(t('channel_edit.requiredName')),
    type: Yup.number().required(t('channel_edit.requiredChannel')),
    key: Yup.string().when('is_edit', { is: false, then: Yup.string().required(t('channel_edit.requiredKey')) }),
    other: Yup.string(),
    proxy: Yup.string(),
    test_model: Yup.string(),
    models: Yup.array().min(1, t('channel_edit.requiredModels')),
    groups: Yup.array().min(1, t('channel_edit.requiredGroup')),
    base_url: Yup.string().when('type', {
      is: (value) => [3, 8].includes(value),
      then: Yup.string().required(t('channel_edit.requiredBaseUrl')), // base_url 是必需的
      otherwise: Yup.string() // 在其他情况下，base_url 可以是任意字符串
    }),
    model_mapping: Yup.array(),
    model_headers: Yup.array()
  });

const EditModal = ({ open, channelId, onCancel, onOk, groupOptions, isTag }) => {
  const { t } = useTranslation();
  const { t: customizeT } = useCustomizeT();
  const theme = useTheme();
  // const [loading, setLoading] = useState(false);
  const [initialInput, setInitialInput] = useState(defaultConfig.input);
  const [inputLabel, setInputLabel] = useState(defaultConfig.inputLabel); //
  const [inputPrompt, setInputPrompt] = useState(defaultConfig.prompt);
  const [modelOptions, setModelOptions] = useState([]);
  const [batchAdd, setBatchAdd] = useState(false);
  const [providerModelsLoad, setProviderModelsLoad] = useState(false);
  const [hasTag, setHasTag] = useState(false);

  const initChannel = (typeValue) => {
    if (typeConfig[typeValue]?.inputLabel) {
      setInputLabel({ ...defaultConfig.inputLabel, ...typeConfig[typeValue].inputLabel });
    } else {
      setInputLabel(defaultConfig.inputLabel);
    }

    if (typeConfig[typeValue]?.prompt) {
      setInputPrompt({ ...defaultConfig.prompt, ...typeConfig[typeValue].prompt });
    } else {
      setInputPrompt(defaultConfig.prompt);
    }

    return typeConfig[typeValue]?.input;
  };

  const handleTypeChange = (setFieldValue, typeValue, values) => {
    // 处理插件事务
    if (pluginList[typeValue]) {
      const newPluginValues = {};
      const pluginConfig = pluginList[typeValue];
      for (const pluginName in pluginConfig) {
        const plugin = pluginConfig[pluginName];
        const oldValve = values['plugin'] ? values['plugin'][pluginName] || {} : {};
        newPluginValues[pluginName] = {};
        for (const paramName in plugin.params) {
          const param = plugin.params[paramName];
          newPluginValues[pluginName][paramName] = oldValve[paramName] || (param.type === 'bool' ? false : '');
        }
      }
      setFieldValue('plugin', newPluginValues);
    }

    const newInput = initChannel(typeValue);

    if (newInput) {
      Object.keys(newInput).forEach((key) => {
        if (
          (!Array.isArray(values[key]) && values[key] !== null && values[key] !== undefined && values[key] !== '') ||
          (Array.isArray(values[key]) && values[key].length > 0)
        ) {
          return;
        }

        if (key === 'models') {
          setFieldValue(key, initialModel(newInput[key]));
          return;
        }
        setFieldValue(key, newInput[key]);
      });
    }
  };

  const basicModels = (channelType) => {
    let modelGroup = typeConfig[channelType]?.modelGroup || defaultConfig.modelGroup;
    // 循环 modelOptions，找到 modelGroup 对应的模型
    let modelList = [];
    modelOptions.forEach((model) => {
      if (model.group === modelGroup) {
        modelList.push(model);
      }
    });
    return modelList;
  };

  const getProviderModels = async (values, setFieldValue) => {
    setProviderModelsLoad(true);
    try {
      const res = await API.post(`/api/channel/provider_models_list`, { ...values, models: '', model_mapping: '', model_headers: '' });
      const { success, message, data } = res.data;
      if (success && data) {
        let uniqueModels = Array.from(new Set(data));
        let modelList = uniqueModels.map((model) => {
          return {
            id: model,
            group: t('channel_edit.customModelTip')
          };
        });

        setFieldValue('models', modelList);
      } else {
        showError(message || t('channel_edit.modelListError'));
      }
    } catch (error) {
      showError(error.message);
    }
    setProviderModelsLoad(false);
  };

  const fetchModels = async () => {
    try {
      let res = await API.get(`/api/channel/models`);
      const { data } = res.data;
      // 先对data排序
      data.sort((a, b) => {
        const ownedByComparison = a.owned_by.localeCompare(b.owned_by);
        if (ownedByComparison === 0) {
          return a.id.localeCompare(b.id);
        }
        return ownedByComparison;
      });
      setModelOptions(
        data.map((model) => {
          return {
            id: model.id,
            group: model.owned_by
          };
        })
      );
    } catch (error) {
      showError(error.message);
    }
  };

  const submit = async (values, { setErrors, setStatus, setSubmitting }) => {
    setSubmitting(true);
    values = trims(values);
    if (values.base_url && values.base_url.endsWith('/')) {
      values.base_url = values.base_url.slice(0, values.base_url.length - 1);
    }
    if (values.type === 3 && values.other === '') {
      values.other = '2024-05-01-preview';
    }
    if (values.type === 18 && values.other === '') {
      values.other = 'v2.1';
    }
    let res;

    let modelMappingModel = [];

    if (values.model_mapping) {
      try {
        const modelMapping = values.model_mapping.reduce((acc, item) => {
          if (item.key && item.value) {
            acc[item.key] = item.value;
          }
          return acc;
        }, {});
        const cleanedMapping = {};

        for (const [key, value] of Object.entries(modelMapping)) {
          if (key && value && !(key in cleanedMapping)) {
            cleanedMapping[key] = value;
            modelMappingModel.push(key);
          }
        }

        values.model_mapping = JSON.stringify(cleanedMapping, null, 2);
      } catch (error) {
        showError('Error parsing model_mapping:' + error.message);
      }
    }
    let modelHeadersKey = [];

    if (values.model_headers) {
      try {
        const modelHeader = values.model_headers.reduce((acc, item) => {
          if (item.key && item.value) {
            acc[item.key] = item.value;
          }
          return acc;
        }, {});
        const cleanedHeader = {};

        for (const [key, value] of Object.entries(modelHeader)) {
          if (key && value && !(key in cleanedHeader)) {
            cleanedHeader[key] = value;
            modelHeadersKey.push(key);
          }
        }

        values.model_headers = JSON.stringify(cleanedHeader, null, 2);
      } catch (error) {
        showError('Error parsing model_headers:' + error.message);
      }
    }

    // 获取现有的模型 ID
    const existingModelIds = values.models.map((model) => model.id);

    // 找出在 modelMappingModel 中存在但不在 existingModelIds 中的模型
    const newModelIds = modelMappingModel.filter((id) => !existingModelIds.includes(id));

    // 合并现有的模型 ID 和新的模型 ID，并去重
    const allUniqueModelIds = Array.from(new Set([...existingModelIds, ...newModelIds]));

    // 创建新的 modelsStr
    const modelsStr = allUniqueModelIds.join(',');
    values.group = values.groups.join(',');

    let baseApiUrl = '/api/channel/';

    if (isTag) {
      baseApiUrl = '/api/channel_tag/' + encodeURIComponent(channelId);
    }

    try {
      if (channelId) {
        res = await API.put(baseApiUrl, { ...values, id: parseInt(channelId), models: modelsStr });
      } else {
        res = await API.post(baseApiUrl, { ...values, models: modelsStr });
      }
      const { success, message } = res.data;
      if (success) {
        if (channelId) {
          showSuccess(t('channel_edit.editSuccess'));
        } else {
          showSuccess(t('channel_edit.addSuccess'));
        }
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
  };

  function initialModel(channelModel) {
    if (!channelModel) {
      return [];
    }

    // 如果 channelModel 是一个字符串
    if (typeof channelModel === 'string') {
      channelModel = channelModel.split(',');
    }
    let modelList = channelModel.map((model) => {
      const modelOption = modelOptions.find((option) => option.id === model);
      if (modelOption) {
        return modelOption;
      }
      return { id: model, group: t('channel_edit.customModelTip') };
    });
    return modelList;
  }

  const loadChannel = async () => {
    try {
      let baseApiUrl = `/api/channel/${channelId}`;

      if (isTag) {
        baseApiUrl = '/api/channel_tag/' + encodeURIComponent(channelId);
      }

      let res = await API.get(baseApiUrl);
      const { success, message, data } = res.data;
      if (success) {
        if (data.models === '') {
          data.models = [];
        } else {
          data.models = initialModel(data.models);
        }
        if (data.group === '') {
          data.groups = [];
        } else {
          data.groups = data.group.split(',');
        }

        data.model_mapping =
          data.model_mapping !== ''
            ? Object.entries(JSON.parse(data.model_mapping)).map(([key, value], index) => ({
                index,
                key,
                value
              }))
            : [];
        // if (data.model_headers) {
          data.model_headers =
          data.model_headers !== ''
            ? Object.entries(JSON.parse(data.model_headers)).map(([key, value], index) => ({
                index,
                key,
                value
              }))
            : [];
        // }

        data.base_url = data.base_url ?? '';
        data.is_edit = true;
        if (data.plugin === null) {
          data.plugin = {};
        }
        initChannel(data.type);
        setInitialInput(data);

        if (!isTag && data.tag) {
          setHasTag(true);
        }
      } else {
        showError(message);
      }
    } catch (error) {
      return;
    }
  };

  useEffect(() => {
    fetchModels().then();
  }, []);

  useEffect(() => {
    setBatchAdd(false);
    if (channelId) {
      loadChannel().then();
    } else {
      setHasTag(false);
      initChannel(1);
      setInitialInput({ ...defaultConfig.input, is_edit: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  const handleModelTagClick = (modelId) => {
    navigator.clipboard.writeText(modelId).then(() => {
      showSuccess('模型名称已复制');
    }).catch((error) => {
      showError('复制失败: ' + error.message);
    });
  };

  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth={'md'}>
      <DialogTitle sx={{ margin: '0px', fontWeight: 700, lineHeight: '1.55556', padding: '24px', fontSize: '1.125rem' }}>
        {channelId ? t('common.edit') : t('common.create')}
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Formik initialValues={initialInput} enableReinitialize validationSchema={getValidationSchema(t)} onSubmit={submit}>
          {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values, setFieldValue }) => (
            <form noValidate onSubmit={handleSubmit}>
              {!isTag && (
                <FormControl fullWidth error={Boolean(touched.type && errors.type)} sx={{ ...theme.typography.otherInput }}>
                  <InputLabel htmlFor="channel-type-label">{customizeT(inputLabel.type)}</InputLabel>
                  <Select
                    id="channel-type-label"
                    label={customizeT(inputLabel.type)}
                    value={values.type}
                    name="type"
                    onBlur={handleBlur}
                    onChange={(e) => {
                      handleChange(e);
                      handleTypeChange(setFieldValue, e.target.value, values);
                    }}
                    disabled={hasTag}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 200
                        }
                      }
                    }}
                  >
                    {Object.values(CHANNEL_OPTIONS).map((option) => {
                      return (
                        <MenuItem key={option.value} value={option.value}>
                          {option.text}
                        </MenuItem>
                      );
                    })}
                  </Select>
                  {touched.type && errors.type ? (
                    <FormHelperText error id="helper-tex-channel-type-label">
                      {errors.type}
                    </FormHelperText>
                  ) : (
                    <FormHelperText id="helper-tex-channel-type-label"> {customizeT(inputPrompt.type)} </FormHelperText>
                  )}
                </FormControl>
              )}

              <FormControl fullWidth error={Boolean(touched.tag && errors.tag)} sx={{ ...theme.typography.otherInput }}>
                <InputLabel htmlFor="channel-tag-label">{customizeT(inputLabel.tag)}</InputLabel>
                <OutlinedInput
                  id="channel-tag-label"
                  label={customizeT(inputLabel.tag)}
                  type="text"
                  value={values.tag}
                  name="tag"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  inputProps={{}}
                  aria-describedby="helper-text-channel-tag-label"
                />
                {touched.tag && errors.tag ? (
                  <FormHelperText error id="helper-tex-channel-tag-label">
                    {errors.tag}
                  </FormHelperText>
                ) : (
                  <FormHelperText id="helper-tex-channel-tag-label"> {customizeT(inputPrompt.tag)} </FormHelperText>
                )}
              </FormControl>

              {!isTag && (
                <FormControl fullWidth error={Boolean(touched.name && errors.name)} sx={{ ...theme.typography.otherInput }}>
                  <InputLabel htmlFor="channel-name-label">{customizeT(inputLabel.name)}</InputLabel>
                  <OutlinedInput
                    id="channel-name-label"
                    label={customizeT(inputLabel.name)}
                    type="text"
                    value={values.name}
                    name="name"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    inputProps={{ autoComplete: 'name' }}
                    aria-describedby="helper-text-channel-name-label"
                  />
                  {touched.name && errors.name ? (
                    <FormHelperText error id="helper-tex-channel-name-label">
                      {errors.name}
                    </FormHelperText>
                  ) : (
                    <FormHelperText id="helper-tex-channel-name-label"> {customizeT(inputPrompt.name)} </FormHelperText>
                  )}
                </FormControl>
              )}
              {channelId === 0 && (
                <Container
                  sx={{
                    textAlign: 'right'
                  }}
                >
                  <Switch checked={batchAdd} onChange={(e) => setBatchAdd(e.target.checked)} />
                  {t('channel_edit.batchAdd')}
                </Container>
              )}

              {!isTag && inputPrompt.base_url && (
                <FormControl fullWidth error={Boolean(touched.base_url && errors.base_url)} sx={{ ...theme.typography.otherInput }}>
                  {!batchAdd ? (
                    <>
                      <InputLabel htmlFor="channel-base_url-label">{customizeT(inputLabel.base_url)}</InputLabel>
                      <OutlinedInput
                        id="channel-base_url-label"
                        label={customizeT(inputLabel.base_url)}
                        type="text"
                        value={values.base_url}
                        name="base_url"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        inputProps={{}}
                        aria-describedby="helper-text-channel-base_url-label"
                      />
                    </>
                  ) : (
                    <TextField
                      multiline
                      id="channel-base_url-label"
                      label={customizeT(inputLabel.base_url)}
                      value={values.base_url}
                      name="base_url"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      aria-describedby="helper-text-channel-base_url-label"
                      minRows={5}
                      placeholder={customizeT(inputPrompt.base_url) + t('channel_edit.batchBaseurlTip')}
                    />
                  )}

                  {touched.base_url && errors.base_url ? (
                    <FormHelperText error id="helper-tex-channel-base_url-label">
                      {errors.base_url}
                    </FormHelperText>
                  ) : (
                    <FormHelperText id="helper-tex-channel-base_url-label"> {customizeT(inputPrompt.base_url)} </FormHelperText>
                  )}
                </FormControl>
              )}

              {inputPrompt.other && (
                <FormControl fullWidth error={Boolean(touched.other && errors.other)} sx={{ ...theme.typography.otherInput }}>
                  <InputLabel htmlFor="channel-other-label">{customizeT(inputLabel.other)}</InputLabel>
                  <OutlinedInput
                    id="channel-other-label"
                    label={customizeT(inputLabel.other)}
                    type="text"
                    value={values.other}
                    name="other"
                    disabled={hasTag}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    inputProps={{}}
                    aria-describedby="helper-text-channel-other-label"
                  />
                  {touched.other && errors.other ? (
                    <FormHelperText error id="helper-tex-channel-other-label">
                      {errors.other}
                    </FormHelperText>
                  ) : (
                    <FormHelperText id="helper-tex-channel-other-label"> {customizeT(inputPrompt.other)} </FormHelperText>
                  )}
                </FormControl>
              )}

              <FormControl fullWidth sx={{ ...theme.typography.otherInput }}>
                <Autocomplete
                  multiple
                  id="channel-groups-label"
                  options={groupOptions}
                  value={values.groups}
                  disabled={hasTag}
                  onChange={(e, value) => {
                    const event = {
                      target: {
                        name: 'groups',
                        value: value
                      }
                    };
                    handleChange(event);
                  }}
                  onBlur={handleBlur}
                  filterSelectedOptions
                  renderInput={(params) => (
                    <TextField {...params} name="groups" error={Boolean(errors.groups)} label={customizeT(inputLabel.groups)} />
                  )}
                  aria-describedby="helper-text-channel-groups-label"
                />
                {errors.groups ? (
                  <FormHelperText error id="helper-tex-channel-groups-label">
                    {errors.groups}
                  </FormHelperText>
                ) : (
                  <FormHelperText id="helper-tex-channel-groups-label"> {customizeT(inputPrompt.groups)} </FormHelperText>
                )}
              </FormControl>

              <FormControl fullWidth sx={{ ...theme.typography.otherInput }}>
                <Autocomplete
                  multiple
                  freeSolo
                  id="channel-models-label"
                  disabled={hasTag}
                  options={modelOptions}
                  value={values.models}
                  onChange={(e, value) => {
                    const event = {
                      target: {
                        name: 'models',
                        value: value.map((item) =>
                          typeof item === 'string' ? { id: item, group: t('channel_edit.customModelTip') } : item
                        )
                      }
                    };
                    handleChange(event);
                  }}
                  onBlur={handleBlur}
                  // filterSelectedOptions
                  disableCloseOnSelect
                  renderInput={(params) => (
                    <TextField {...params} name="models" error={Boolean(errors.models)} label={customizeT(inputLabel.models)} />
                  )}
                  groupBy={(option) => option.group}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') {
                      return option;
                    }
                    if (option.inputValue) {
                      return option.inputValue;
                    }
                    return option.id;
                  }}
                  filterOptions={(options, params) => {
                    const filtered = filter(options, params);
                    const { inputValue } = params;
                    const isExisting = options.some((option) => inputValue === option.id);
                    if (inputValue !== '' && !isExisting) {
                      filtered.push({
                        id: inputValue,
                        group: t('channel_edit.customModelTip')
                      });
                    }
                    return filtered;
                  }}
                  renderOption={(props, option, { selected }) => (
                    <li {...props}>
                      <Checkbox icon={icon} checkedIcon={checkedIcon} style={{ marginRight: 8 }} checked={selected} />
                      {option.id}
                    </li>
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option.id}
                        {...getTagProps({ index })}
                        onClick={() => handleModelTagClick(option.id)}
                      />
                    ))
                  }
                />
                {errors.models ? (
                  <FormHelperText error id="helper-tex-channel-models-label">
                    {errors.models}
                  </FormHelperText>
                ) : (
                  <FormHelperText id="helper-tex-channel-models-label"> {customizeT(inputPrompt.models)} </FormHelperText>
                )}
              </FormControl>
              <Container
                sx={{
                  textAlign: 'right'
                }}
              >
                <ButtonGroup variant="outlined" aria-label="small outlined primary button group">
                  <Button
                    disabled={hasTag}
                    onClick={() => {
                      setFieldValue('models', basicModels(values.type));
                    }}
                  >
                    {t('channel_edit.inputChannelModel')}
                  </Button>
                  <Button
                    disabled={hasTag}
                    onClick={() => {
                      setFieldValue('models', modelOptions);
                    }}
                  >
                    {t('channel_edit.inputAllModel')}
                  </Button>
                  {inputLabel.provider_models_list && (
                    <Tooltip title={customizeT(inputPrompt.provider_models_list)} placement="top">
                      <LoadingButton
                        loading={providerModelsLoad}
                        disabled={hasTag}
                        onClick={() => {
                          getProviderModels(values, setFieldValue);
                        }}
                      >
                        {customizeT(inputLabel.provider_models_list)}
                      </LoadingButton>
                    </Tooltip>
                  )}
                </ButtonGroup>
              </Container>
              {!isTag && (
                <FormControl fullWidth error={Boolean(touched.key && errors.key)} sx={{ ...theme.typography.otherInput }}>
                  {!batchAdd ? (
                    <>
                      <InputLabel htmlFor="channel-key-label">{customizeT(inputLabel.key)}</InputLabel>
                      <OutlinedInput
                        id="channel-key-label"
                        label={customizeT(inputLabel.key)}
                        type="text"
                        value={values.key}
                        name="key"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        inputProps={{}}
                        aria-describedby="helper-text-channel-key-label"
                      />
                    </>
                  ) : (
                    <TextField
                      multiline
                      id="channel-key-label"
                      label={customizeT(inputLabel.key)}
                      value={values.key}
                      name="key"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      aria-describedby="helper-text-channel-key-label"
                      minRows={5}
                      placeholder={customizeT(inputPrompt.key) + t('channel_edit.batchKeytip')}
                    />
                  )}

                  {touched.key && errors.key ? (
                    <FormHelperText error id="helper-tex-channel-key-label">
                      {errors.key}
                    </FormHelperText>
                  ) : (
                    <FormHelperText id="helper-tex-channel-key-label"> {customizeT(inputPrompt.key)} </FormHelperText>
                  )}
                </FormControl>
              )}

              {inputPrompt.model_mapping && (
                <FormControl
                  fullWidth
                  error={Boolean(touched.model_mapping && errors.model_mapping)}
                  sx={{ ...theme.typography.otherInput }}
                >
                  <ModelMappingInput
                    value={values.model_mapping}
                    onChange={(newValue) => {
                      setFieldValue('model_mapping', newValue);
                    }}
                    disabled={hasTag}
                    error={Boolean(touched.model_mapping && errors.model_mapping)}
                  />
                  {touched.model_mapping && errors.model_mapping ? (
                    <FormHelperText error id="helper-tex-channel-model_mapping-label">
                      {errors.model_mapping}
                    </FormHelperText>
                  ) : (
                    <FormHelperText id="helper-tex-channel-model_mapping-label">{customizeT(inputPrompt.model_mapping)}</FormHelperText>
                  )}
                </FormControl>
              )}
              {inputPrompt.model_headers && (
                <FormControl
                  fullWidth
                  error={Boolean(touched.model_headers && errors.model_headers)}
                  sx={{ ...theme.typography.otherInput }}
                >
                  <ModelHeadersInput
                    value={values.model_headers}
                    onChange={(newValue) => {
                      setFieldValue('model_headers', newValue);
                    }}
                    disabled={hasTag}
                    error={Boolean(touched.model_headers && errors.model_headers)}
                  />
                  {touched.model_headers && errors.model_headers ? (
                    <FormHelperText error id="helper-tex-channel-model_headers-label">
                      {errors.model_headers}
                    </FormHelperText>
                  ) : (
                    <FormHelperText id="helper-tex-channel-model_headers-label">{customizeT(inputPrompt.model_headers)}</FormHelperText>
                  )}
                </FormControl>
              )}
              <FormControl fullWidth error={Boolean(touched.proxy && errors.proxy)} sx={{ ...theme.typography.otherInput }}>
                <InputLabel htmlFor="channel-proxy-label">{customizeT(inputLabel.proxy)}</InputLabel>
                <OutlinedInput
                  id="channel-proxy-label"
                  label={customizeT(inputLabel.proxy)}
                  disabled={hasTag}
                  type="text"
                  value={values.proxy}
                  name="proxy"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  inputProps={{}}
                  aria-describedby="helper-text-channel-proxy-label"
                />
                {touched.proxy && errors.proxy ? (
                  <FormHelperText error id="helper-tex-channel-proxy-label">
                    {errors.proxy}
                  </FormHelperText>
                ) : (
                  <FormHelperText id="helper-tex-channel-proxy-label"> {customizeT(inputPrompt.proxy)} </FormHelperText>
                )}
              </FormControl>
              {inputPrompt.test_model && (
                <FormControl fullWidth error={Boolean(touched.test_model && errors.test_model)} sx={{ ...theme.typography.otherInput }}>
                  <InputLabel htmlFor="channel-test_model-label">{customizeT(inputLabel.test_model)}</InputLabel>
                  <OutlinedInput
                    id="channel-test_model-label"
                    label={customizeT(inputLabel.test_model)}
                    type="text"
                    disabled={hasTag}
                    value={values.test_model}
                    name="test_model"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    inputProps={{}}
                    aria-describedby="helper-text-channel-test_model-label"
                  />
                  {touched.test_model && errors.test_model ? (
                    <FormHelperText error id="helper-tex-channel-test_model-label">
                      {errors.test_model}
                    </FormHelperText>
                  ) : (
                    <FormHelperText id="helper-tex-channel-test_model-label"> {customizeT(inputPrompt.test_model)} </FormHelperText>
                  )}
                </FormControl>
              )}

              {inputPrompt.pre_cost && (
                <FormControl fullWidth error={Boolean(touched.pre_cost && errors.pre_cost)} sx={{ ...theme.typography.otherInput }}>
                  <InputLabel htmlFor="channel-pre_cost-label">{customizeT(inputLabel.pre_cost)}</InputLabel>
                  <Select
                    id="channel-pre_cost-label"
                    label={customizeT(inputLabel.pre_cost)}
                    value={values.pre_cost}
                    name="pre_cost"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    disabled={hasTag}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 200
                        }
                      }
                    }}
                  >
                    {PreCostType.map((option) => {
                      return (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      );
                    })}
                  </Select>
                  {touched.pre_cost && errors.pre_cost ? (
                    <FormHelperText error id="helper-tex-channel-pre_cost-label">
                      {errors.pre_cost}
                    </FormHelperText>
                  ) : (
                    <FormHelperText id="helper-tex-channel-pre_cost-label"> {customizeT(inputPrompt.pre_cost)} </FormHelperText>
                  )}
                </FormControl>
              )}
              {inputPrompt.only_chat && (
                <FormControl fullWidth>
                  <FormControlLabel
                    control={
                      <Switch
                        disabled={hasTag}
                        checked={values.only_chat === true}
                        onClick={() => {
                          setFieldValue('only_chat', !values.only_chat);
                        }}
                      />
                    }
                    label={customizeT(inputLabel.only_chat)}
                  />
                  <FormHelperText id="helper-tex-only_chat_model-label"> {customizeT(inputPrompt.only_chat)} </FormHelperText>
                </FormControl>
              )}
              {pluginList[values.type] &&
                Object.keys(pluginList[values.type]).map((pluginId) => {
                  const plugin = pluginList[values.type][pluginId];
                  return (
                    <>
                      <Divider sx={{ ...theme.typography.otherInput }} />
                      <Typography variant="h3">{customizeT(plugin.name)}</Typography>
                      <Typography variant="caption">{customizeT(plugin.description)}</Typography>
                      {Object.keys(plugin.params).map((paramId) => {
                        const param = plugin.params[paramId];
                        const name = `plugin.${pluginId}.${paramId}`;
                        return param.type === 'bool' ? (
                          <FormControl key={name} fullWidth sx={{ ...theme.typography.otherInput }}>
                            <FormControlLabel
                              key={name}
                              required
                              control={
                                <Switch
                                  key={name}
                                  name={name}
                                  disabled={hasTag}
                                  checked={values.plugin?.[pluginId]?.[paramId] || false}
                                  onChange={(event) => {
                                    setFieldValue(name, event.target.checked);
                                  }}
                                />
                              }
                              label={t('channel_edit.isEnable')}
                            />
                            <FormHelperText id="helper-tex-channel-key-label"> {customizeT(param.description)} </FormHelperText>
                          </FormControl>
                        ) : (
                          <FormControl key={name} fullWidth sx={{ ...theme.typography.otherInput }}>
                            <TextField
                              multiline
                              key={name}
                              name={name}
                              disabled={hasTag}
                              value={values.plugin?.[pluginId]?.[paramId] || ''}
                              label={customizeT(param.name)}
                              placeholder={customizeT(param.description)}
                              onChange={handleChange}
                            />
                            <FormHelperText id="helper-tex-channel-key-label"> {customizeT(param.description)} </FormHelperText>
                          </FormControl>
                        );
                      })}
                    </>
                  );
                })}
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
  channelId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onCancel: PropTypes.func,
  onOk: PropTypes.func,
  groupOptions: PropTypes.array,
  isTag: PropTypes.bool
};
