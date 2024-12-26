import { useState, useEffect } from 'react';

import { LoadingButton } from '@mui/lab';
import { alpha } from '@mui/material/styles';
import {
  Box,
  Paper,
  Stack,
  Dialog,
  Button,
  Checkbox,
  Collapse,
  Typography,
  DialogTitle,
  DialogContent,
  FormControlLabel
} from '@mui/material';
import { API } from 'utils/api';
import { showError } from 'utils/common';

import { Icon } from '@iconify/react';

export function ChannelCheck({ item, open, onClose }) {
  const [providerModelsLoad, setProviderModelsLoad] = useState(false);
  const [modelList, setModelList] = useState([]);
  const [checkLoad, setCheckLoad] = useState(false);
  const [selectedModels, setSelectedModels] = useState([]);
  const [checkResults, setCheckResults] = useState([]);
  const [expandedResponses, setExpandedResponses] = useState({});
  const [expandedModels, setExpandedModels] = useState({});

  useEffect(() => {
    if (item?.models) {
      const initialModels = item.models.split(',');
      setModelList(initialModels);
      setSelectedModels(initialModels);
    }
  }, [item?.models]);

  const handleSelectAll = () => {
    setSelectedModels(modelList);
  };

  const handleUnselectAll = () => {
    setSelectedModels([]);
  };

  const handleModelToggle = (model) => {
    setSelectedModels((prev) => (prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]));
  };

  const getProviderModels = async (values) => {
    setProviderModelsLoad(true);
    try {
      const res = await API.post(`/api/channel/provider_models_list`, {
        ...values,
        models: '',
        model_mapping: ''
      });
      const { success, message, data } = res.data;
      if (success && data) {
        const filteredModels = data.filter((model) => {
          if (model.startsWith('gpt-') || model.startsWith('chatgpt-')) {
            return !model.includes('-all') && !model.includes('-realtime') && !model.includes('-instruct');
          }
          if (model.startsWith('gemini-')) {
            return true;
          }
          if (model.startsWith('claude-')) {
            return true;
          }
          return false;
        });

        const uniqueModels = [...new Set(filteredModels)];
        setModelList(uniqueModels);
      } else {
        showError(message || '获取模型失败');
      }
    } catch (error) {
      showError(error.message);
    }
    setProviderModelsLoad(false);
  };

  const handleCheck = async () => {
    setCheckLoad(true);
    setCheckResults([]);
    try {
      const response = await API.post(
        `/api/sse/channel/check`,
        {
          id: item.id,
          models: selectedModels.join(',')
        },
        {
          responseType: 'text',
          onDownloadProgress: (progressEvent) => {
            const text = progressEvent.currentTarget.response;
            const lines = text.split('\n');

            lines.forEach((line) => {
              if (line.trim() === '' || !line.startsWith('data:')) return;

              const jsonStr = line.slice(5);
              try {
                const eventData = JSON.parse(jsonStr);
                if (eventData.type === 'result') {
                  setCheckResults((prev) => {
                    const existingIndex = prev.findIndex((item2) => item2.model === eventData.data.model);

                    if (existingIndex !== -1) {
                      const newResults = [...prev];
                      newResults[existingIndex] = eventData.data;
                      return newResults;
                    }

                    return [...prev, eventData.data];
                  });
                }
              } catch (e) {
                // 忽略解析错误
              }
            });
          }
        }
      );

      if (response.status !== 200) {
        showError(response.data?.message || '检测失败');
        return;
      }
    } catch (error) {
      showError(error.message);
    }
    setCheckLoad(false);
  };

  const toggleResponse = (modelIndex, processIndex) => {
    const key = `${modelIndex}-${processIndex}`;
    setExpandedResponses((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getModelStatus = (result) => {
    const hasFailure = result.process.some((process) => process.results.some((item2) => item2.status !== 1));
    return {
      success: !hasFailure,
      icon: hasFailure ? 'solar:danger-circle-bold' : 'solar:check-circle-bold',
      color: hasFailure ? '#FF4842' : '#54D62C',
      text: hasFailure ? '检测异常' : '检测通过'
    };
  };

  const toggleModel = (modelIndex) => {
    setExpandedModels((prev) => ({
      ...prev,
      [modelIndex]: !prev[modelIndex]
    }));
  };

  return (
    <Dialog
      fullWidth
      maxWidth={false}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          maxWidth: 800,
          borderRadius: 2,
          backgroundImage: 'none'
        }
      }}
    >
      <DialogTitle
        sx={{
          pb: 3,
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          模型渠道检测
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              onClick={() => getProviderModels(item)}
              disabled={providerModelsLoad}
              startIcon={<Icon icon="solar:refresh-bold" />}
            >
              获取可用模型
            </Button>
            <Button onClick={handleSelectAll} startIcon={<Icon icon="solar:check-square-bold" />}>
              全选
            </Button>
            <Button onClick={handleUnselectAll} startIcon={<Icon icon="solar:square-bold" />}>
              反选
            </Button>
          </Stack>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.50')
            }}
          >
            {modelList.map((model) => (
              <FormControlLabel
                key={model}
                control={<Checkbox checked={selectedModels.includes(model)} onChange={() => handleModelToggle(model)} />}
                label={model}
                sx={{ mr: 3, mb: 1 }}
              />
            ))}
          </Paper>

          <LoadingButton
            fullWidth
            variant="contained"
            onClick={handleCheck}
            loading={checkLoad}
            disabled={selectedModels.length === 0}
            sx={{ height: 48 }}
          >
            开始检测
          </LoadingButton>

          <Stack spacing={2}>
            {checkResults.map((result, modelIndex) => (
              <Paper
                key={modelIndex}
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.50')
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2} onClick={() => toggleModel(modelIndex)} sx={{ cursor: 'pointer' }}>
                  <Icon icon={expandedModels[modelIndex] ? 'solar:arrow-down-bold' : 'solar:arrow-right-bold'} />
                  <Typography variant="subtitle1" sx={{ flex: 1, fontWeight: 500 }}>
                    {result.model}
                  </Typography>

                  <Box
                    sx={{
                      py: 0.5,
                      px: 1.5,
                      borderRadius: 1,
                      bgcolor: () => alpha(getModelStatus(result).color, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <Icon icon={getModelStatus(result).icon} width={16} sx={{ color: getModelStatus(result).color }} />
                    <Typography variant="caption" sx={{ color: getModelStatus(result).color, fontWeight: 500 }}>
                      {getModelStatus(result).text}
                    </Typography>
                  </Box>
                </Stack>

                <Collapse in={expandedModels[modelIndex]}>
                  <Box sx={{ mt: 2 }}>
                    {result.process.map((process, processIndex) => (
                      <Box key={processIndex} sx={{ mb: 2 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            mb: 1,
                            color: 'primary.main',
                            fontWeight: 500
                          }}
                        >
                          {process.name}
                        </Typography>

                        <Stack spacing={1} sx={{ mb: 1 }}>
                          {process.results.map((item2, rIndex) => (
                            <Paper
                              key={rIndex}
                              variant="outlined"
                              sx={{
                                p: 1,
                                borderColor: item2.status === 1 ? 'success.light' : 'error.light',
                                bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'background.paper')
                              }}
                            >
                              <Stack direction="row" alignItems="flex-start" spacing={1}>
                                <Icon
                                  icon={item2.status === 1 ? 'solar:check-circle-bold' : 'solar:close-circle-bold'}
                                  width={20}
                                  sx={{
                                    color: item2.status === 1 ? 'success.main' : 'error.main',
                                    mt: 0.25
                                  }}
                                />
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                                    {item2.name}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      whiteSpace: 'pre-wrap',
                                      color: 'text.secondary'
                                    }}
                                  >
                                    {item2.remark}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Paper>
                          ))}
                        </Stack>

                        <Button
                          size="small"
                          onClick={() => toggleResponse(modelIndex, processIndex)}
                          endIcon={
                            <Icon
                              icon={expandedResponses[`${modelIndex}-${processIndex}`] ? 'solar:arrow-up-bold' : 'solar:arrow-down-bold'}
                            />
                          }
                        >
                          Response 详情
                        </Button>

                        <Collapse in={expandedResponses[`${modelIndex}-${processIndex}`]}>
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 2,
                              mt: 1,
                              borderRadius: 1,
                              bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'grey.50')
                            }}
                          >
                            <pre
                              style={{
                                margin: 0,
                                whiteSpace: 'pre-wrap',
                                fontSize: '0.875rem'
                              }}
                            >
                              {JSON.stringify(process.response, null, 2)}
                            </pre>
                          </Paper>
                        </Collapse>
                      </Box>
                    ))}
                  </Box>
                </Collapse>
              </Paper>
            ))}
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
