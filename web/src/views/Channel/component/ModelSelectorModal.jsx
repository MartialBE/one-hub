import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { API } from 'utils/api';
import { showError, showSuccess } from 'utils/common';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Divider,
  FormControl,
  InputLabel,
  OutlinedInput,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  IconButton,
  FormHelperText,
  Typography,
  InputAdornment,
  FormControlLabel,
  Switch,
  Collapse,
  Chip,
  Paper,
  Skeleton,
  Tooltip,
  Alert,
  Container,
  ButtonGroup
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { useSelector } from 'react-redux';

const ModelSelectorModal = ({ open, onClose, onConfirm, channelValues, prices }) => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState([]);
  const [selectedModels, setSelectedModels] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpenAIMode, setIsOpenAIMode] = useState(false);
  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const [modelGroups, setModelGroups] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});
  const [error, setError] = useState('');
  const ownedby = useSelector((state) => state.siteInfo?.ownedby);
  const [addToMapping, setAddToMapping] = useState(false);
  const [removePrefixOrSuffix, setRemovePrefixOrSuffix] = useState(true);
  const [prefixOrSuffix, setPrefixOrSuffix] = useState('');
  const [addPlusSign, setAddPlusSign] = useState(false);
  const [convertToLowercase, setConvertToLowercase] = useState(false);
  const [filterMappedModels, setFilterMappedModels] = useState(false);
  const [overwriteMappings, setOverwriteMappings] = useState(false);
  const [overwriteModels, setOverwriteModels] = useState(false);
  const [mappingPreview, setMappingPreview] = useState({});
  const [modelsListCollapsed, setModelsListCollapsed] = useState(false);

  const getOwnedbyName = (id) => {
    const owner = ownedby.find((item) => item.id === id);
    return owner?.name;
  };

  const getChannelTypeByModel = (model) => {
    const price = prices.find((item) => item.model === model);
    return price?.channel_type;
  };

  useEffect(() => {
    if (open) {
      if (channelValues?.models) {
        try {
          const modelsList = channelValues.models.map(({ id }) => ({
            id,
            group: t('channel_edit.existingModels')
          }));
          setSelectedModels(modelsList);
        } catch (e) {
          console.error('Error parsing existing models', e);
          setSelectedModels([]);
        }
      } else {
        setSelectedModels([]);
      }

      if (channelValues?.base_url) {
        setCustomBaseUrl(channelValues.base_url);
      }

      setAddToMapping(false);
      setRemovePrefixOrSuffix(true);
      setPrefixOrSuffix('');
      setAddPlusSign(false);
      setConvertToLowercase(false);
      setFilterMappedModels(false);
      setOverwriteMappings(false);
      setOverwriteModels(false);
      setMappingPreview({});
    }
  }, [open, channelValues, t]);

  useEffect(() => {
    if (!addToMapping || selectedModels.length === 0) {
      setMappingPreview({});
      return;
    }

    const preview = {};
    selectedModels.forEach((model) => {
      const originalId = model.id;
      let key = originalId;
      let value = originalId;

      if (prefixOrSuffix) {
        if (removePrefixOrSuffix) {
          if (key.startsWith(prefixOrSuffix)) {
            key = key.substring(prefixOrSuffix.length);
          }
        } else {
          if (key.endsWith(prefixOrSuffix)) {
            key = key.substring(0, key.length - prefixOrSuffix.length);
          }
        }
      }

      if (key.includes('/')) {
        key = key.split('/').pop();
      }

      if (convertToLowercase) {
        key = key.toLowerCase();
      }

      if (addPlusSign) {
        value = `+${value}`;
      }

      if (key !== value) {
        preview[key] = value;
      }
    });

    setMappingPreview(preview);
  }, [selectedModels, addToMapping, removePrefixOrSuffix, prefixOrSuffix, addPlusSign, convertToLowercase]);

  const handleOpenAIModeChange = (event) => {
    const isChecked = event.target.checked;
    setIsOpenAIMode(isChecked);

    if (isChecked && !customBaseUrl && channelValues?.base_url) {
      setCustomBaseUrl(channelValues.base_url);
    }
  };

  const fetchModels = async () => {
    setLoading(true);
    setError('');
    try {
      const requestData = {
        ...channelValues,
        models: '',
        model_mapping: '',
        model_headers: ''
      };

      if (isOpenAIMode) {
        requestData.type = 1;
        if (customBaseUrl) {
          requestData.base_url = customBaseUrl;
        }
      }

      const res = await API.post(`/api/channel/provider_models_list`, requestData);
      const { success, message, data } = res.data;

      if (success && data) {
        const groupedModels = {};
        const uniqueModels = Array.from(new Set(data)).map((model) => {
          let group = t('channel_edit.otherModels');

          const channelType = getChannelTypeByModel(model);

          if (channelType) {
            const modelGroup = getOwnedbyName(channelType);
            if (modelGroup) {
              group = modelGroup;
            }
          } else if (model.includes('/')) {
            const modelGroup = model.split('/')[0];
            group = modelGroup;
          }

          return { id: model, group };
        });

        uniqueModels.forEach((model) => {
          if (!groupedModels[model.group]) {
            groupedModels[model.group] = [];
          }
          groupedModels[model.group].push(model);
        });

        setModels(uniqueModels);
        setModelGroups(groupedModels);

        const defaultExpanded = {};
        Object.keys(groupedModels).forEach((group) => {
          defaultExpanded[group] = true;
        });
        setExpandedGroups(defaultExpanded);

        showSuccess(t('channel_edit.modelsFetched'));
      } else {
        setError(message || t('channel_edit.modelListError'));
        showError(message || t('channel_edit.modelListError'));
      }
    } catch (error) {
      setError(error.message);
      showError(error.message);
    }
    setLoading(false);
  };

  const handleModelToggle = (model) => {
    const currentIndex = selectedModels.findIndex((m) => m.id === model.id);
    const newSelectedModels = [...selectedModels];

    if (currentIndex === -1) {
      newSelectedModels.push(model);
    } else {
      newSelectedModels.splice(currentIndex, 1);
    }

    setSelectedModels(newSelectedModels);
  };

  const toggleGroupExpand = (group) => {
    setExpandedGroups({
      ...expandedGroups,
      [group]: !expandedGroups[group]
    });
  };

  const handleSelectGroup = (group) => {
    const groupModels = modelGroups[group] || [];
    const allSelected = groupModels.every((model) => selectedModels.some((m) => m.id === model.id));

    if (allSelected) {
      setSelectedModels(selectedModels.filter((model) => !groupModels.some((m) => m.id === model.id)));
    } else {
      const modelsToAdd = groupModels.filter((model) => !selectedModels.some((m) => m.id === model.id));
      setSelectedModels([...selectedModels, ...modelsToAdd]);
    }
  };

  const handleSelectAll = () => {
    if (filteredModels.length === selectedModels.length) {
      const filteredIds = new Set(filteredModels.map((model) => model.id));
      setSelectedModels(selectedModels.filter((model) => !filteredIds.has(model.id)));
    } else {
      const existingIds = new Set(selectedModels.map((model) => model.id));
      const newModels = filteredModels.filter((model) => !existingIds.has(model.id));
      setSelectedModels([...selectedModels, ...newModels]);
    }
  };

  const handleInvertSelection = () => {
    const newSelectedModels = [...selectedModels];

    filteredModels.forEach((model) => {
      const index = newSelectedModels.findIndex((m) => m.id === model.id);
      if (index === -1) {
        newSelectedModels.push(model);
      } else {
        newSelectedModels.splice(index, 1);
      }
    });

    setSelectedModels(newSelectedModels);
  };

  const filteredModels = models.filter((model) => model.id.toLowerCase().includes(searchTerm.toLowerCase()));

  const getFilteredModelsByGroup = () => {
    const result = {};

    if (filteredModels.length === 0) return result;

    filteredModels.forEach((model) => {
      if (!result[model.group]) {
        result[model.group] = [];
      }
      result[model.group].push(model);
    });

    return result;
  };

  const filteredModelsByGroup = getFilteredModelsByGroup();

  const handleConfirm = () => {
    const mappings = addToMapping
      ? Object.entries(mappingPreview).map(([key, value], index) => ({
          index,
          key,
          value
        }))
      : [];

    let modelsToSubmit = [...selectedModels];

    if (addToMapping && mappings.length > 0) {
      if (filterMappedModels) {
        const mappedValues = mappings.map(m => m.value.startsWith('+') ? m.value.substring(1) : m.value);
        modelsToSubmit = selectedModels.filter(model => !mappedValues.includes(model.id));
      }

      const mappedModels = mappings.map(mapping => {
        return { id: mapping.key, group: t('channel_edit.customModelTip') };
      });

      const existingIds = new Set(modelsToSubmit.map(model => model.id));
      const newMappedModels = mappedModels.filter(model => !existingIds.has(model.id));

      modelsToSubmit = [...modelsToSubmit, ...newMappedModels];
    }
    
    onConfirm(modelsToSubmit, mappings, overwriteModels, overwriteMappings);
    onClose();
  };

  const handleClose = () => {
    setModels([]);
    setSelectedModels([]);
    setSearchTerm('');
    setError('');
    setAddToMapping(false);
    setPrefixOrSuffix('');
    setAddPlusSign(false);
    setConvertToLowercase(false);
    setFilterMappedModels(false);
    setOverwriteMappings(false);
    setOverwriteModels(false);
    setMappingPreview({});
    onClose();
  };

  const getSelectedCountInGroup = (group) => {
    const groupModels = modelGroups[group] || [];
    return groupModels.filter((model) => selectedModels.some((m) => m.id === model.id)).length;
  };

  const renderGroupHeader = (group) => {
    const groupModels = modelGroups[group] || [];
    const selectedCount = getSelectedCountInGroup(group);
    const allSelected = selectedCount === groupModels.length && groupModels.length > 0;
    const someSelected = selectedCount > 0 && selectedCount < groupModels.length;

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 1,
          bgcolor: 'background.paper',
          borderRadius: 1,
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' }
        }}
        onClick={() => toggleGroupExpand(group)}
      >
        <Checkbox
          edge="start"
          checked={allSelected}
          indeterminate={someSelected}
          onClick={(e) => {
            e.stopPropagation();
            handleSelectGroup(group);
          }}
          disabled={groupModels.length === 0}
        />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, flexGrow: 1 }}>
          {group}
        </Typography>
        <Chip
          size="small"
          label={`${selectedCount}/${groupModels.length}`}
          color={selectedCount > 0 ? 'primary' : 'default'}
          sx={{ mr: 1 }}
        />
        <IconButton size="small">
          <Icon icon={expandedGroups[group] ? 'mdi:chevron-up' : 'mdi:chevron-down'} />
        </IconButton>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: { xs: 1, sm: 2 },
          overflow: 'hidden',
          width: { xs: '100%', sm: '90%' },
          margin: { xs: 0, sm: 'auto' },
          maxHeight: { xs: '100%', sm: '90vh' }
        }
      }}
      sx={{
        '& .MuiDialog-container': {
          alignItems: { xs: 'flex-end', sm: 'center' }
        }
      }}
    >
      <DialogTitle
        sx={{
          margin: 0,
          fontWeight: 700,
          lineHeight: '1.5',
          padding: { xs: '12px 16px', sm: '16px 24px' },
          fontSize: { xs: '1rem', sm: '1.125rem' },
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Icon icon="mdi:robot" style={{ marginRight: 8 }} />
        {t('channel_edit.modelSelector')}
      </DialogTitle>
      <Divider />
      <DialogContent
        sx={{
          height: { xs: 'calc(100vh - 120px)', sm: '550px' },
          display: 'flex',
          flexDirection: 'column',
          p: { xs: 2, sm: 3 },
          overflow: 'auto'
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 1.5, sm: 2 },
              mb: 2,
              borderRadius: { xs: 1, sm: 2 },
              bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)')
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              <FormControlLabel
                control={<Switch checked={isOpenAIMode} onChange={handleOpenAIModeChange} color="primary" />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Icon icon="simple-icons:openai" style={{ marginRight: 8 }} />
                    {t('channel_edit.openaiMode')}
                  </Box>
                }
                sx={{ m: 0 }}
              />

              <Box
                sx={{
                  display: 'flex',
                  flexGrow: 1,
                  gap: { xs: 1, sm: 2 },
                  alignItems: 'center',
                  width: '100%',
                  mt: isOpenAIMode ? 1 : 0,
                  mb: isOpenAIMode ? 1 : 0,
                  flexDirection: { xs: 'column', sm: 'row' }
                }}
              >
                {isOpenAIMode && (
                  <FormControl
                    fullWidth
                    sx={{
                      '& .MuiFormHelperText-root': {
                        position: { xs: 'static', sm: 'absolute' },
                        bottom: '-20px',
                        mt: { xs: 0.5, sm: 0 }
                      }
                    }}
                  >
                    <InputLabel htmlFor="openai-base-url">{t('channel_edit.baseUrl')}</InputLabel>
                    <OutlinedInput
                      id="openai-base-url"
                      label={t('channel_edit.baseUrl')}
                      value={customBaseUrl}
                      onChange={(e) => setCustomBaseUrl(e.target.value)}
                      placeholder="https://api.openai.com"
                      size="small"
                      endAdornment={
                        customBaseUrl && (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setCustomBaseUrl('')} edge="end">
                              <Icon icon="mdi:close" />
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    />
                    <FormHelperText>{t('channel_edit.openaiBaseUrlTip')}</FormHelperText>
                  </FormControl>
                )}

                <LoadingButton
                  variant="contained"
                  loading={loading}
                  onClick={fetchModels}
                  startIcon={<Icon icon="mdi:cloud-download" />}
                  sx={{
                    height: '40px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    width: { xs: '100%', sm: 'auto' }
                  }}
                >
                  {t('channel_edit.fetchModels')}
                </LoadingButton>
              </Box>
            </Box>
          </Paper>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              action={
                <IconButton color="inherit" size="small" onClick={() => setError('')}>
                  <Icon icon="mdi:close" />
                </IconButton>
              }
            >
              {error}
            </Alert>
          )}

          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 1.5, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'stretch', gap: 1 }}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                label={t('channel_edit.searchModels')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Icon icon="mdi:magnify" />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchTerm('')} edge="end">
                        <Icon icon="mdi:close" />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{ flex: '1 1 auto' }}
              />

              <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'space-between', sm: 'flex-start' } }}>
                <Tooltip title={t('channel_edit.selectAllTooltip')}>
                  <span>
                    <Button
                      onClick={handleSelectAll}
                      startIcon={<Icon icon="mdi:select-all" />}
                      variant="outlined"
                      size="small"
                      disabled={loading || models.length === 0}
                      sx={{ whiteSpace: 'nowrap', flex: { xs: 1, sm: 'none' } }}
                    >
                      {t('channel_edit.selectAll')}
                    </Button>
                  </span>
                </Tooltip>

                <Tooltip title={t('channel_edit.invertSelectionTooltip')}>
                  <span>
                    <Button
                      onClick={handleInvertSelection}
                      startIcon={<Icon icon="mdi:swap-horizontal" />}
                      variant="outlined"
                      size="small"
                      disabled={loading || models.length === 0}
                      sx={{ whiteSpace: 'nowrap', flex: { xs: 1, sm: 'none' } }}
                    >
                      {t('channel_edit.invertSelection')}
                    </Button>
                  </span>
                </Tooltip>

                <Tooltip title={t('channel_edit.clearModelsTip')} placement="top">
                    <span>
                      <Button
                        variant="outlined"
                        onClick={() => setSelectedModels([])}
                        startIcon={<Icon icon="mdi:refresh" />}
                        disabled={selectedModels.length === 0}
                        size="small"
                        sx={{ whiteSpace: 'nowrap', flex: { xs: 1, sm: 'none' } }}
                      >
                        {t('common.reset')}
                      </Button>
                    </span>
                  </Tooltip>

                <Tooltip title={modelsListCollapsed ? t('channel_edit.expandList') : t('channel_edit.collapseList')}>
                  <span>
                    <IconButton
                      onClick={() => setModelsListCollapsed(!modelsListCollapsed)}
                      size="small"
                      color={modelsListCollapsed ? 'primary' : 'default'}
                      sx={{ border: '1px solid', borderColor: 'divider' }}
                    >
                      <Icon icon={modelsListCollapsed ? 'mdi:chevron-down' : 'mdi:chevron-up'} />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </Box>

            <Collapse in={!modelsListCollapsed} timeout="auto">
              <Paper
                variant="outlined"
                sx={{
                  flexGrow: 1,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: { xs: 1, sm: 2 },
                  mb: 2,
                  height: modelsListCollapsed ? '0px' : 'auto',
                  minHeight: modelsListCollapsed ? '0px' : { xs: '150px', sm: '200px' },
                  maxHeight: { xs: '300px', sm: '400px' }
                }}
              >
                {loading ? (
                  <Box sx={{ p: 2 }}>
                    {[1, 2, 3, 4].map((i) => (
                      <Box key={i} sx={{ mb: 2 }}>
                        <Skeleton variant="rectangular" height={40} sx={{ mb: 1, borderRadius: 1 }} />
                        <Box sx={{ pl: 2 }}>
                          {[1, 2, 3].map((j) => (
                            <Skeleton key={j} variant="rectangular" height={30} sx={{ mb: 0.5, borderRadius: 1 }} />
                          ))}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : models.length === 0 ? (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '100%',
                      p: { xs: 2, sm: 4 }
                    }}
                  >
                    <Icon icon="mdi:robot-confused" style={{ fontSize: 64, opacity: 0.5, marginBottom: 16 }} />
                    <Typography variant="h6" color="text.secondary">
                      {t('channel_edit.noModels')}
                    </Typography>
                  </Box>
                ) : filteredModels.length === 0 ? (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '100%',
                      p: { xs: 2, sm: 4 }
                    }}
                  >
                    <Icon icon="mdi:file-search-outline" style={{ fontSize: 64, opacity: 0.5, marginBottom: 16 }} />
                    <Typography variant="h6" color="text.secondary">
                      {t('channel_edit.noMatchingModels')}
                    </Typography>
                    <Button variant="text" startIcon={<Icon icon="mdi:close" />} onClick={() => setSearchTerm('')} sx={{ mt: 2 }}>
                      {t('channel_edit.clearSearch')}
                    </Button>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      overflow: 'auto',
                      height: '100%',
                      p: { xs: 1, sm: 1.5 },
                      WebkitOverflowScrolling: 'touch'
                    }}
                  >
                    {Object.entries(filteredModelsByGroup).map(([group, groupModels]) => (
                      <Box key={group} sx={{ mb: 1.5 }}>
                        {renderGroupHeader(group)}
                        <Collapse in={expandedGroups[group]} timeout="auto">
                          <List dense disablePadding sx={{ pl: { xs: 1, sm: 2 } }}>
                            {groupModels.map((model) => {
                              const isSelected = selectedModels.some((m) => m.id === model.id);
                              return (
                                <ListItem
                                  key={model.id}
                                  dense
                                  button
                                  onClick={() => handleModelToggle(model)}
                                  sx={{
                                    borderRadius: 1,
                                    mb: 0.5,
                                    transition: 'all 0.2s',
                                    py: { xs: 0.75, sm: 0.5 },
                                    '&:hover': {
                                      bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)')
                                    },
                                    ...(isSelected && {
                                      bgcolor: (theme) =>
                                        theme.palette.mode === 'dark' ? 'rgba(144,202,249,0.15)' : 'rgba(33,150,243,0.08)'
                                    })
                                  }}
                                >
                                  <ListItemIcon sx={{ minWidth: { xs: 36, sm: 42 } }}>
                                    <Checkbox edge="start" checked={isSelected} tabIndex={-1} disableRipple color="primary" size="small" />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={model.id}
                                    primaryTypographyProps={{
                                      sx: {
                                        fontFamily: 'monospace',
                                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        ...(isSelected && { fontWeight: 600 })
                                      }
                                    }}
                                  />
                                </ListItem>
                              );
                            })}
                          </List>
                        </Collapse>
                      </Box>
                    ))}
                  </Box>
                )}
              </Paper>
            </Collapse>

            <Paper
              variant="outlined"
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: { xs: 1, sm: 2 },
                bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'),
                display: selectedModels.length > 0 ? 'block' : 'none',
                flexGrow: modelsListCollapsed ? 1 : 0,
                overflow: modelsListCollapsed ? 'auto' : 'visible',
                maxHeight: modelsListCollapsed ? { xs: '300px', sm: '400px' } : 'none'
              }}
            >
              <FormControlLabel
                control={<Switch checked={overwriteModels} onChange={(e) => setOverwriteModels(e.target.checked)} color="primary" />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Icon icon="mdi:playlist-remove" style={{ marginRight: 8 }} />
                    {t('channel_edit.overwriteModels')}
                    <Tooltip title={t('channel_edit.overwriteModelsTip')} placement="top" arrow>
                      <Icon icon="mdi:help-circle-outline" style={{ marginLeft: 4, opacity: 0.7 }} />
                    </Tooltip>
                  </Box>
                }
                sx={{ m: 0 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <FormControlLabel
                  control={<Switch checked={addToMapping} onChange={(e) => setAddToMapping(e.target.checked)} color="primary" />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Icon icon="mdi:map-marker-path" style={{ marginRight: 8 }} />
                      {t('channel_edit.addToModelMapping')}
                    </Box>
                  }
                  sx={{ m: 0 }}
                />
                {modelsListCollapsed && (
                  <Chip
                    icon={<Icon icon="mdi:check-circle" />}
                    label={t('channel_edit.selectedCount', { count: selectedModels.length })}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                )}
              </Box>

              <Collapse in={addToMapping}>
                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('channel_edit.modelMappingSettings')}
                  </Typography>

                  <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel>{t('channel_edit.prefixOrSuffix')}</InputLabel>
                    <OutlinedInput
                      value={prefixOrSuffix}
                      onChange={(e) => setPrefixOrSuffix(e.target.value)}
                      label={t('channel_edit.prefixOrSuffix')}
                      placeholder={removePrefixOrSuffix ? 'openai/' : ':free'}
                      endAdornment={
                        prefixOrSuffix && (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setPrefixOrSuffix('')} edge="end">
                              <Icon icon="mdi:close" />
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    />
                    <FormHelperText>
                      {removePrefixOrSuffix ? t('channel_edit.removePrefixHelp') : t('channel_edit.removeSuffixHelp')}
                    </FormHelperText>
                  </FormControl>

                  <FormControlLabel
                    control={<Switch checked={removePrefixOrSuffix} onChange={(e) => setRemovePrefixOrSuffix(e.target.checked)} />}
                    label={t(removePrefixOrSuffix ? 'channel_edit.removePrefix' : 'channel_edit.removeSuffix')}
                    sx={{ my: 0 }}
                  />

                  <FormControlLabel
                    control={<Switch checked={addPlusSign} onChange={(e) => setAddPlusSign(e.target.checked)} />}
                    label={t('channel_edit.addPlusSign')}
                    sx={{ my: 0 }}
                  />

                  <FormControlLabel
                    control={<Switch checked={convertToLowercase} onChange={(e) => setConvertToLowercase(e.target.checked)} />}
                    label={t('channel_edit.convertToLowercase')}
                    sx={{ my: 0 }}
                  />

                  <FormControlLabel
                    control={<Switch checked={filterMappedModels} onChange={(e) => setFilterMappedModels(e.target.checked)} />}
                    label={t('channel_edit.filterMappedModels')}
                    sx={{ my: 0 }}
                  />
                  
                  <FormControlLabel
                    control={<Switch checked={overwriteMappings} onChange={(e) => setOverwriteMappings(e.target.checked)} />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {t('channel_edit.overwriteMappings')}
                        <Tooltip title={t('channel_edit.overwriteMappingsTip')} placement="top" arrow>
                          <Icon icon="mdi:help-circle-outline" style={{ marginLeft: 4, opacity: 0.7 }} />
                        </Tooltip>
                      </Box>
                    }
                    sx={{ my: 0 }}
                  />

                  {Object.keys(mappingPreview).length > 0 && (
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {t('channel_edit.mappingPreview')} ({Object.keys(mappingPreview).length})
                      </Typography>
                      <Box
                        sx={{
                          maxHeight: modelsListCollapsed ? '300px' : { xs: '80px', sm: '120px' },
                          overflowY: 'auto',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          p: 1,
                          bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)')
                        }}
                      >
                        <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {JSON.stringify(mappingPreview, null, 2)}
                        </pre>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Collapse>
            </Paper>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions
        sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 }, flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'stretch', gap: 1 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', width: { xs: '100%', sm: 'auto' } }}>
          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            <Icon icon="mdi:information-outline" style={{ marginRight: 4, opacity: 0.7 }} />
            {addToMapping
              ? t('channel_edit.selectedMappingCount', {
                  count: selectedModels.length,
                  mappingCount: Object.keys(mappingPreview).length
                })
              : t('channel_edit.selectedCount', { count: selectedModels.length })}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', width: { xs: '100%', sm: 'auto' }, gap: 1 }}>
          <Button
            onClick={handleClose}
            startIcon={<Icon icon="mdi:close" />}
            fullWidth={true}
            variant="outlined"
            sx={{ display: { xs: 'flex', sm: 'inline-flex' } }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            color="primary"
            disabled={selectedModels.length === 0}
            startIcon={<Icon icon={addToMapping ? 'mdi:map-marker-path' : 'mdi:check'} />}
            fullWidth={true}
            sx={{ display: { xs: 'flex', sm: 'inline-flex' } }}
          >
            {addToMapping ? t('channel_edit.addMapping') : t('common.submit')}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

ModelSelectorModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  channelValues: PropTypes.object,
  prices: PropTypes.array
};

export default ModelSelectorModal;
