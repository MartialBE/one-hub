import PropTypes from 'prop-types';
import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Paper,
  Pagination,
  InputAdornment,
  useTheme,
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Icon } from '@iconify/react';
import { showError, showSuccess, trims } from 'utils/common';
import { API } from 'utils/api';
import { useTranslation } from 'react-i18next';
import { getPageSize, savePageSize } from 'constants';
import PriceCard from './component/PriceCard';
import { alpha } from '@mui/material/styles';
import EditModal from './component/EditModal';
import ToggleButtonGroup from 'ui-component/ToggleButton';

const Single = ({ ownedby, prices, reloadData }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [rows, setRows] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(getPageSize('pricing', 24));
  const [channelFilter, setChannelFilter] = useState('all');
  const [lockFilter, setLockFilter] = useState('all');
  const [unit, setUnit] = useState('K');

  const unitOptions = [
    { value: 'K', label: 'K' },
    { value: 'M', label: 'M' }
  ];

  // 删除确认对话框
  const handleDeleteClick = (row) => {
    setSelectedRow(row);
  };

  const handleClose = () => {
    setSelectedRow(null);
  };

  const handleConfirmDelete = async () => {
    await deletePirces(selectedRow.model);
    setSelectedRow(null);
  };

  // 编辑对话框
  const handleEditClick = (row) => {
    setEditRow(row);
  };

  const handleEditClose = () => {
    setEditRow(null);
  };

  const handleUnitChange = (event, newUnit) => {
    if (newUnit !== null) {
      setUnit(newUnit);
    }
  };

  const handleSaveEdit = async (formData) => {
    try {
      let res;
      formData = trims(formData);
      if (formData.isNew || !editRow?.model) {
        res = await API.post('/api/prices/single', formData);
      } else {
        let modelEncode = encodeURIComponent(editRow.model);
        res = await API.put('/api/prices/single/' + modelEncode, formData);
      }
      const { success, message } = res.data;
      if (success) {
        showSuccess(t('pricing_edit.saveOk'));
        reloadData();
        setEditRow(null);
      } else {
        showError(message);
      }
    } catch (error) {
      showError(error.message);
    }
  };

  const deletePirces = async (modelName) => {
    try {
      let modelEncode = encodeURIComponent(modelName);
      const res = await API.delete('/api/prices/single/' + modelEncode);
      const { success, message } = res.data;
      if (success) {
        showSuccess(t('pricing_edit.saveOk'));
        await reloadData();
      } else {
        showError(message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // 筛选和分页
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      // 搜索过滤 - 支持模型名称、渠道类型搜索
      const searchMatch =
        searchTerm === '' ||
        row.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ownedby
          .find((o) => o.value === row.channel_type)
          ?.label.toLowerCase()
          .includes(searchTerm.toLowerCase());

      // 类型过滤
      let typeMatch = true;
      if (filterType !== 'all') {
        typeMatch = row.type === filterType;
      }

      // 渠道过滤
      let channelMatch = true;
      if (channelFilter !== 'all') {
        channelMatch = row.channel_type === channelFilter;
      }

      // 锁定状态过滤
      let lockMatch = true;
      if (lockFilter !== 'all') {
        lockMatch = row.locked === (lockFilter === 'locked');
      }

      return searchMatch && typeMatch && channelMatch && lockMatch;
    });
  }, [rows, searchTerm, filterType, channelFilter, lockFilter, ownedby]);

  const paginatedRows = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    return filteredRows.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  const pageCount = useMemo(() => {
    return Math.ceil(filteredRows.length / rowsPerPage);
  }, [filteredRows, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const newPageSize = parseInt(event.target.value, 10);
    setRowsPerPage(newPageSize);
    savePageSize('pricing', newPageSize);
    setPage(1);
  };

  // 初始化数据
  useEffect(() => {
    let modelRatioList = [];
    let id = 0;
    for (let key in prices) {
      modelRatioList.push({ id: id++, ...prices[key] });
    }
    setRows(modelRatioList);
  }, [prices]);

  // 当搜索词变化时重置到第一页
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterType, lockFilter]);

  return (
    <Box sx={{ width: '100%' }}>
      {/* 工具栏 */}
      <Paper
        elevation={0}
        variant="outlined"
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 1
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 2,
            justifyContent: 'space-between'
          }}
        >
          {/* 搜索栏 */}
          <TextField
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ width: { xs: '100%', sm: 280 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton edge="end" onClick={() => setSearchTerm('')} size="small">
                    <Icon icon="mdi:close" width={16} />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          {/* 过滤和分页控制 */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 1,
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>{t('pricing_edit.type')}</InputLabel>
              <Select value={filterType} onChange={(e) => setFilterType(e.target.value)} label={t('pricing_edit.type')}>
                <MenuItem value="all">{t('modelpricePage.all')}</MenuItem>
                <MenuItem value="tokens">{t('modelpricePage.tokens')}</MenuItem>
                <MenuItem value="times">{t('modelpricePage.times')}</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>{t('modelpricePage.channelType')}</InputLabel>
              <Select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} label={t('modelpricePage.channelType')}>
                <MenuItem value="all">{t('modelpricePage.all')}</MenuItem>
                {ownedby.map((channel) => (
                  <MenuItem key={channel.value} value={channel.value}>
                    {channel.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>{t('pricing_edit.locked_title')}</InputLabel>
              <Select value={lockFilter} onChange={(e) => setLockFilter(e.target.value)} label={t('pricing_edit.locked_title')}>
                <MenuItem value="all">{t('modelpricePage.all')}</MenuItem>
                <MenuItem value="locked">{t('pricing_edit.locked')}</MenuItem>
                <MenuItem value="unlocked">{t('pricing_edit.unlocked')}</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 90 }}>
              <InputLabel>{t('common.pageSize')}</InputLabel>
              <Select value={rowsPerPage} onChange={handleChangeRowsPerPage} label={t('common.pageSize')}>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
            </FormControl>

            <ToggleButtonGroup value={unit} onChange={handleUnitChange} options={unitOptions} aria-label="unit toggle" />
          </Box>
        </Box>
      </Paper>

      {/* 数据表格 */}
      {filteredRows.length > 0 ? (
        <Paper
          elevation={0}
          variant="outlined"
          sx={{
            overflow: 'hidden',
            borderRadius: 1,
            mb: 2
          }}
        >
          {/* 表头 */}
          <Box
            sx={{
              display: 'flex',
              px: 2,
              py: 1.5,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`
            }}
          >
            <Box width="25%" px={1}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('modelpricePage.model')}
              </Typography>
            </Box>
            <Box width="20%" px={1}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('modelpricePage.price')} ({unit})
              </Typography>
            </Box>
            <Box width="45%" px={1}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('modelpricePage.extraRatios')}
              </Typography>
            </Box>
            <Box width="10%" px={1} textAlign="right">
              <Typography variant="subtitle2" color="text.secondary">
                {t('common.actions')}
              </Typography>
            </Box>
          </Box>

          {/* 表格内容 */}
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
            <Box component="tbody">
              {paginatedRows.map((price) => (
                <PriceCard
                  key={price.id}
                  price={price}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                  ownedby={ownedby}
                  unit={unit}
                />
              ))}
            </Box>
          </Box>

          {/* 分页 */}
          {filteredRows.length > rowsPerPage && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2,
                py: 1.5,
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {t('common.total')}: {filteredRows.length}
              </Typography>

              <Pagination
                count={pageCount}
                page={page}
                onChange={handleChangePage}
                color="primary"
                showFirstButton
                showLastButton
                siblingCount={1}
                size="small"
              />
            </Box>
          )}
        </Paper>
      ) : (
        <Paper
          elevation={0}
          variant="outlined"
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 1
          }}
        >
          <Icon icon="mdi:file-search-outline" width={48} height={48} color={alpha(theme.palette.text.secondary, 0.4)} />
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            {searchTerm || filterType !== 'all' || lockFilter !== 'all' ? t('common.noSearchResults') : t('common.noDataAvailable')}
          </Typography>
        </Paper>
      )}

      {/* 删除确认对话框 */}
      <Dialog open={!!selectedRow} onClose={handleClose}>
        <DialogTitle>{t('pricing_edit.delTip')}</DialogTitle>
        <DialogContent dividers>{t('pricing_edit.delInfoTip', { name: selectedRow?.model })}</DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{t('common.cancel')}</Button>
          <Button onClick={handleConfirmDelete} color="error">
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 编辑对话框 - 使用可复用的EditModal组件 */}
      <EditModal
        open={editRow !== null}
        onCancel={handleEditClose}
        onSaveSingle={handleSaveEdit}
        ownedby={ownedby}
        singleMode={true}
        price={editRow}
        rows={rows}
        unit={unit}
      />
    </Box>
  );
};

export default Single;

Single.propTypes = {
  prices: PropTypes.array,
  ownedby: PropTypes.array,
  reloadData: PropTypes.func
};
