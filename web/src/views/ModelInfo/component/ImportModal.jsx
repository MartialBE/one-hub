import PropTypes from 'prop-types';
import { useState } from 'react';
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
  FormHelperText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Box,
  Alert,
  LinearProgress,
  Typography
} from '@mui/material';
import { showSuccess, showError } from 'utils/common';
import { API } from 'utils/api';
import { Icon } from '@iconify/react';

const ImportModal = ({ open, onCancel, onOk, existingModels = [] }) => {
  const [jsonUrl, setJsonUrl] = useState('');
  const [previewData, setPreviewData] = useState([]);
  const [conflictStrategy, setConflictStrategy] = useState('skip'); // 'skip' or 'overwrite'
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [urlError, setUrlError] = useState('');

  const handleFetchData = async () => {
    if (!jsonUrl.trim()) {
      setUrlError('请输入 JSON URL');
      return;
    }

    setLoading(true);
    setUrlError('');
    setPreviewData([]);

    try {
      const response = await fetch(jsonUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const jsonData = await response.json();

      // 验证数据格式
      if (!jsonData.data || !Array.isArray(jsonData.data)) {
        throw new Error('JSON 格式错误：缺少 data 数组');
      }

      // 转换数据格式
      const transformedData = jsonData.data
        .filter((item) => item.model_info) // 只处理有 model_info 的项
        .map((item) => {
          const modelInfo = item.model_info;
          return {
            model: modelInfo.model || item.model,
            name: modelInfo.name || modelInfo.model || item.model,
            description: modelInfo.description || '',
            context_length: modelInfo.context_length || 0, // 默认值
            max_tokens: modelInfo.max_tokens || 0,
            input_modalities: JSON.stringify(modelInfo.input_modalities || []),
            output_modalities: JSON.stringify(modelInfo.output_modalities || []),
            tags: JSON.stringify(modelInfo.tags || []),
            isConflict: existingModels.includes(modelInfo.model || item.model)
          };
        });

      setPreviewData(transformedData);
      if (transformedData.length === 0) {
        showError('没有找到有效的模型数据');
      } else {
        showSuccess(`成功获取 ${transformedData.length} 条模型数据`);
      }
    } catch (error) {
      console.error('Failed to fetch JSON data:', error);
      setUrlError(error.message || '获取 JSON 数据失败');
      showError('获取 JSON 数据失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (previewData.length === 0) {
      showError('没有可导入的数据');
      return;
    }

    setImporting(true);
    setImportProgress({ current: 0, total: previewData.length });

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < previewData.length; i++) {
      const item = previewData[i];
      setImportProgress({ current: i + 1, total: previewData.length });

      // 处理冲突
      if (item.isConflict && conflictStrategy === 'skip') {
        skipCount++;
        continue;
      }

      try {
        // 准备提交的数据（移除 isConflict 标记）
        const submitData = { ...item };
        delete submitData.isConflict;

        if (item.isConflict && conflictStrategy === 'overwrite') {
          // 查找现有记录的 ID（需要从 existingModels 获取完整信息）
          // 注意：这里需要传入完整的模型信息，而不仅仅是模型名称
          // 暂时使用 POST 创建，如果需要更新，需要调整数据结构
          await API.post('/api/model_info/', submitData);
        } else {
          await API.post('/api/model_info/', submitData);
        }
        successCount++;
      } catch (error) {
        console.error(`Failed to import model ${item.model}:`, error);
        errorCount++;
      }
    }

    setImporting(false);

    // 显示导入结果
    const messages = [];
    if (successCount > 0) messages.push(`成功导入 ${successCount} 条`);
    if (skipCount > 0) messages.push(`跳过 ${skipCount} 条`);
    if (errorCount > 0) messages.push(`失败 ${errorCount} 条`);

    if (errorCount > 0) {
      showError(`导入完成：${messages.join('，')}`);
    } else {
      showSuccess(`导入完成：${messages.join('，')}`);
    }

    // 重置状态
    setJsonUrl('');
    setPreviewData([]);
    setImportProgress({ current: 0, total: 0 });
    onOk(true);
  };

  const handleClose = () => {
    setJsonUrl('');
    setPreviewData([]);
    setUrlError('');
    setImportProgress({ current: 0, total: 0 });
    onCancel();
  };

  const conflictCount = previewData.filter((item) => item.isConflict).length;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ margin: '0px', fontWeight: 700, lineHeight: '1.55556', padding: '24px', fontSize: '1.125rem' }}>
        批量导入模型信息
      </DialogTitle>
      <Divider />
      <DialogContent>
        {/* URL 输入 */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <FormControl fullWidth error={Boolean(urlError)}>
              <InputLabel htmlFor="json-url-input">数据源地址</InputLabel>
              <OutlinedInput
                id="json-url-input"
                label="数据源地址"
                type="text"
                value={jsonUrl}
                onChange={(e) => {
                  setJsonUrl(e.target.value);
                  setUrlError('');
                }}
                placeholder="https://example.com/models.json"
              />
              {urlError && (
                <FormHelperText error id="helper-text-json-url">
                  {urlError}
                </FormHelperText>
              )}
            </FormControl>
            <Button
              onClick={handleFetchData}
              disabled={loading}
              variant="contained"
              size="large"
              sx={{
                minWidth: '120px',
                height: '50px',
                whiteSpace: 'nowrap'
              }}
              startIcon={loading ? <CircularProgress size={20} /> : <Icon icon="solar:download-bold-duotone" />}
            >
              获取数据
            </Button>
          </Box>
        </Box>

        {/* 冲突处理选项 */}
        {previewData.length > 0 && conflictCount > 0 && (
          <Box sx={{ mb: 3 }}>
            {/* 警告提示 */}
            <Alert
              severity="warning"
              icon={<Icon icon="solar:danger-triangle-bold-duotone" width={24} />}
              sx={{
                mb: 3,
                borderRadius: 2,
                backgroundColor: 'rgba(255, 152, 0, 0.08)',
                border: '1px solid rgba(255, 152, 0, 0.2)',
                '& .MuiAlert-message': {
                  fontWeight: 500
                }
              }}
            >
              检测到 <strong>{conflictCount}</strong> 个模型标识冲突，请选择处理策略
            </Alert>

            {/* 策略选择卡片 */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  color: 'text.primary',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Icon icon="solar:settings-minimalistic-bold-duotone" width={20} />
                冲突处理策略
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {/* 跳过策略卡片 */}
                <Box
                  onClick={() => setConflictStrategy('skip')}
                  sx={{
                    flex: 1,
                    p: 2.5,
                    borderRadius: 2,
                    cursor: 'pointer',
                    border: '2px solid',
                    borderColor: conflictStrategy === 'skip' ? 'primary.main' : 'divider',
                    backgroundColor: conflictStrategy === 'skip' ? 'rgba(103, 58, 183, 0.08)' : 'background.paper',
                    transition: 'all 0.2s ease-in-out',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      borderColor: conflictStrategy === 'skip' ? 'primary.main' : 'primary.light',
                      transform: 'translateY(-2px)',
                      boxShadow: conflictStrategy === 'skip' ? 3 : 2
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: conflictStrategy === 'skip' ? 'linear-gradient(90deg, #673AB7 0%, #9C27B0 100%)' : 'transparent',
                      transition: 'all 0.2s'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Box
                      sx={{
                        mt: 0.5,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        border: '2px solid',
                        borderColor: conflictStrategy === 'skip' ? 'primary.main' : 'divider',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: conflictStrategy === 'skip' ? 'primary.main' : 'transparent',
                        transition: 'all 0.2s'
                      }}
                    >
                      {conflictStrategy === 'skip' && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: 'white'
                          }}
                        />
                      )}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Icon
                          icon="solar:skip-next-bold-duotone"
                          width={22}
                          style={{
                            color: conflictStrategy === 'skip' ? 'var(--mui-palette-primary-main)' : 'var(--mui-palette-text-secondary)'
                          }}
                        />
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 600,
                            color: conflictStrategy === 'skip' ? 'primary.main' : 'text.primary'
                          }}
                        >
                          跳过已存在的
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        保留现有数据，仅导入新模型
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* 覆盖策略卡片 */}
                <Box
                  onClick={() => setConflictStrategy('overwrite')}
                  sx={{
                    flex: 1,
                    p: 2.5,
                    borderRadius: 2,
                    cursor: 'pointer',
                    border: '2px solid',
                    borderColor: conflictStrategy === 'overwrite' ? 'warning.main' : 'divider',
                    backgroundColor: conflictStrategy === 'overwrite' ? 'rgba(255, 152, 0, 0.08)' : 'background.paper',
                    transition: 'all 0.2s ease-in-out',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      borderColor: conflictStrategy === 'overwrite' ? 'warning.main' : 'warning.light',
                      transform: 'translateY(-2px)',
                      boxShadow: conflictStrategy === 'overwrite' ? 3 : 2
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: conflictStrategy === 'overwrite' ? 'linear-gradient(90deg, #FF9800 0%, #FF6F00 100%)' : 'transparent',
                      transition: 'all 0.2s'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Box
                      sx={{
                        mt: 0.5,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        border: '2px solid',
                        borderColor: conflictStrategy === 'overwrite' ? 'warning.main' : 'divider',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: conflictStrategy === 'overwrite' ? 'warning.main' : 'transparent',
                        transition: 'all 0.2s'
                      }}
                    >
                      {conflictStrategy === 'overwrite' && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: 'white'
                          }}
                        />
                      )}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Icon
                          icon="solar:refresh-bold-duotone"
                          width={22}
                          style={{
                            color:
                              conflictStrategy === 'overwrite' ? 'var(--mui-palette-warning-main)' : 'var(--mui-palette-text-secondary)'
                          }}
                        />
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 600,
                            color: conflictStrategy === 'overwrite' ? 'warning.main' : 'text.primary'
                          }}
                        >
                          覆盖已存在的
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        使用新数据替换现有模型
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* 导入进度 */}
        {importing && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              正在导入：{importProgress.current} / {importProgress.total}
            </Typography>
            <LinearProgress variant="determinate" value={(importProgress.current / importProgress.total) * 100} />
          </Box>
        )}

        {/* 预览数据表格 */}
        {previewData.length > 0 && (
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>模型标识</TableCell>
                  <TableCell>模型名称</TableCell>
                  <TableCell>上下文长度</TableCell>
                  <TableCell>最大Token</TableCell>
                  <TableCell>输入模态</TableCell>
                  <TableCell>输出模态</TableCell>
                  <TableCell>标签</TableCell>
                  <TableCell>状态</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {previewData.map((row, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      backgroundColor: row.isConflict ? 'rgba(255, 152, 0, 0.08)' : 'inherit'
                    }}
                  >
                    <TableCell>{row.model}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.context_length}</TableCell>
                    <TableCell>{row.max_tokens}</TableCell>
                    <TableCell>{JSON.parse(row.input_modalities).join(', ')}</TableCell>
                    <TableCell>{JSON.parse(row.output_modalities).join(', ')}</TableCell>
                    <TableCell>{JSON.parse(row.tags).join(', ')}</TableCell>
                    <TableCell>
                      {row.isConflict ? (
                        <Typography variant="caption" color="warning.main">
                          已存在
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="success.main">
                          新增
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {previewData.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <Icon icon="solar:cloud-download-linear" width={48} style={{ opacity: 0.5 }} />
            <Typography variant="body2" sx={{ mt: 1 }}>
              输入JSON URL并点击&quot;获取数据&quot;开始
            </Typography>
          </Box>
        )}
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button onClick={handleClose} disabled={importing}>
          取消
        </Button>
        <Button
          onClick={handleImport}
          disabled={previewData.length === 0 || importing}
          variant="contained"
          color="primary"
          startIcon={importing ? <CircularProgress size={16} /> : <Icon icon="solar:upload-bold-duotone" />}
        >
          {importing ? '导入中...' : '开始导入'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportModal;

ImportModal.propTypes = {
  open: PropTypes.bool,
  onCancel: PropTypes.func,
  onOk: PropTypes.func,
  existingModels: PropTypes.array
};
