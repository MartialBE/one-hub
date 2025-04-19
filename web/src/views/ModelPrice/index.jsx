import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import {
  Card,
  Stack,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Box
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { API } from 'utils/api';
import { showError, ValueFormatter } from 'utils/common';
import { useTheme } from '@mui/material/styles';
import IconWrapper from 'ui-component/IconWrapper';
import Label from 'ui-component/Label';
import ToggleButtonGroup from 'ui-component/ToggleButton';
// ----------------------------------------------------------------------
export default function ModelPrice() {
  const { t } = useTranslation();
  const theme = useTheme();
  const ownedby = useSelector((state) => state.siteInfo?.ownedby);

  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableModels, setAvailableModels] = useState({});
  const [userGroupMap, setUserGroupMap] = useState({});
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedOwnedBy, setSelectedOwnedBy] = useState('');
  const [unit, setUnit] = useState('K');

  const unitOptions = [
    { value: 'K', label: 'K' },
    { value: 'M', label: 'M' }
  ];

  const fetchAvailableModels = useCallback(async () => {
    try {
      const res = await API.get('/api/available_model');
      const { success, message, data } = res.data;
      if (success) {
        setAvailableModels(data);
        setSelectedOwnedBy(Object.values(data)[0]?.owned_by || '');
      } else {
        showError(message);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchUserGroupMap = useCallback(async () => {
    try {
      const res = await API.get('/api/user_group_map');
      const { success, message, data } = res.data;
      if (success) {
        setUserGroupMap(data);
        setSelectedGroup(Object.keys(data)[0]); // 默认选择第一个分组
      } else {
        showError(message);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchAvailableModels();
    fetchUserGroupMap();
  }, [fetchAvailableModels, fetchUserGroupMap]);

  useEffect(() => {
    if (!availableModels || !userGroupMap || !selectedGroup) return;

    const newRows = Object.entries(availableModels)
      .filter(([, model]) => model.owned_by === selectedOwnedBy)
      .map(([modelName, model], index) => {
        const group = userGroupMap[selectedGroup];
        const price = model.groups.includes(selectedGroup)
          ? {
              input: group.ratio * model.price.input,
              output: group.ratio * model.price.output
            }
          : { input: t('modelpricePage.noneGroup'), output: t('modelpricePage.noneGroup') };

        const formatPrice = (value, type) => {
          if (typeof value === 'number') {
            let nowUnit = '';
            let isM = unit === 'M';
            if (type === 'times') {
              isM = false;
            }
            if (type === 'tokens') {
              nowUnit = `/ 1${unit}`;
            }
            return ValueFormatter(value, true, isM) + nowUnit;
          }
          return value;
        };

        return {
          id: index + 1,
          model: modelName,
          userGroup: model.groups,
          type: model.price.type,
          input: formatPrice(price.input, model.price.type),
          output: formatPrice(price.output, model.price.type),
          extraRatios: model.price?.extra_ratios
        };
      });

    setRows(newRows);
    setFilteredRows(newRows);
  }, [availableModels, userGroupMap, selectedGroup, selectedOwnedBy, t, unit]);

  useEffect(() => {
    const filtered = rows.filter((row) => row.model.toLowerCase().includes(searchQuery.toLowerCase()));
    setFilteredRows(filtered);
  }, [searchQuery, rows]);

  const handleTabChange = (event, newValue) => {
    setSelectedOwnedBy(newValue);
  };

  const handleGroupChange = (event) => {
    setSelectedGroup(event.target.value);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleUnitChange = (event, newUnit) => {
    if (newUnit !== null) {
      setUnit(newUnit);
    }
  };

  const uniqueOwnedBy = [...new Set(Object.values(availableModels).map((model) => model.owned_by))];

  const getIconByName = (name) => {
    const owner = ownedby.find((item) => item.name === name);
    return owner?.icon;
  };

  return (
    <Stack spacing={3} sx={{ padding: theme.spacing(3) }}>
      <Stack direction="column" spacing={1}>
        <Typography variant="h2">{t('modelpricePage.availableModels')}</Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Available Models
        </Typography>
      </Stack>

      <Card sx={{ p: 2, backgroundColor: theme.palette.background.paper }}>
        <Stack spacing={2}>
          <Typography variant="subtitle2" color="textSecondary">
            {t('modelpricePage.group')}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 2
            }}
          >
            {Object.entries(userGroupMap).map(([key, group]) => (
              <Card
                key={key}
                onClick={() => handleGroupChange({ target: { value: key } })}
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  transform: selectedGroup === key ? 'scale(1.02)' : 'none',
                  border: (theme) => `1px solid ${selectedGroup === key ? theme.palette.primary.main : theme.palette.divider}`,
                  backgroundColor: (theme) => (selectedGroup === key ? theme.palette.primary.light : theme.palette.background.paper),
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" color={selectedGroup === key ? 'primary.main' : 'text.primary'}>
                      {group.name}
                    </Typography>
                  </Stack>
                  <Stack spacing={1}>
                    <Typography variant="body2" color="text.secondary">
                      {t('modelpricePage.rate')}：{' '}
                      {group.ratio > 0 ? (
                        <Label color={group.ratio > 1 ? 'warning' : 'info'}>x{group.ratio}</Label>
                      ) : (
                        <Label color="success">{t('modelpricePage.free')}</Label>
                      )}
                    </Typography>
                  </Stack>
                </Stack>
              </Card>
            ))}
          </Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              placeholder={t('modelpricePage.search')}
              value={searchQuery}
              onChange={handleSearchChange}
              variant="outlined"
              size="small"
              sx={{ backgroundColor: theme.palette.background.paper }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
            <ToggleButtonGroup value={unit} onChange={handleUnitChange} options={unitOptions} aria-label="unit toggle" />
          </Stack>
        </Stack>
      </Card>

      <Box sx={{ width: '100%' }}>
        <Tabs
          value={selectedOwnedBy}
          onChange={handleTabChange}
          textColor="inherit"
          indicatorColor="primary"
          variant="standard"
          sx={{
            '& .MuiTabs-flexContainer': {
              flexWrap: 'wrap',
              gap: 1
            },
            '& .MuiTabs-indicator': {
              display: 'none'
            }
          }}
        >
          {uniqueOwnedBy.map((ownedBy, index) => (
            <Tab
              key={index}
              value={ownedBy}
              icon={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <IconWrapper url={getIconByName(ownedBy)} />
                  <span>{ownedBy}</span>
                </Stack>
              }
              sx={{
                minHeight: '48px',
                padding: '6px 16px',
                borderRadius: 1,
                transition: 'all 0.2s ease-in-out',
                '& .MuiTab-iconWrapper': {
                  margin: 0
                },
                '&:hover': {
                  backgroundColor: (theme) => theme.palette.action.hover,
                  transform: 'translateY(-1px)'
                },
                '&.Mui-selected': {
                  backgroundColor: (theme) => theme.palette.action.selected,
                  boxShadow: (theme) => (theme.palette.mode === 'dark' ? '0 2px 4px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.1)')
                }
              }}
            />
          ))}
        </Tabs>
      </Box>

      <Card sx={{ backgroundColor: theme.palette.background.default }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="25%">{t('modelpricePage.model')}</TableCell>
                <TableCell width="10%">{t('modelpricePage.type')}</TableCell>
                <TableCell width="22.5%">{t('modelpricePage.inputMultiplier')}</TableCell>
                <TableCell width="22.5%">{t('modelpricePage.outputMultiplier')}</TableCell>
                <TableCell width="22.5%">{t('modelpricePage.other')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.model}</TableCell>
                  <TableCell>
                    {row.type === 'tokens' ? (
                      <Label color="primary">{t('modelpricePage.tokens')}</Label>
                    ) : (
                      <Label color="secondary">{t('modelpricePage.times')}</Label>
                    )}
                  </TableCell>
                  <TableCell>
                    <Label color="info" variant="outlined">
                      {row.input}
                    </Label>
                  </TableCell>
                  <TableCell>
                    <Label color="info" variant="outlined">
                      {row.output}
                    </Label>
                  </TableCell>
                  <TableCell>{getOther(t, row.extraRatios)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Stack>
  );
}

function getOther(t, extraRatios) {
  if (!extraRatios) return '';
  const inputRatio = extraRatios.input_audio_tokens_ratio;
  const outputRatio = extraRatios.output_audio_tokens_ratio;

  return (
    <Stack direction="column" spacing={1}>
      <Label color="primary" variant="outlined">
        {t('modelpricePage.inputAudioTokensRatio')}: {inputRatio}
      </Label>
      <Label color="primary" variant="outlined">
        {t('modelpricePage.outputAudioTokensRatio')}: {outputRatio}
      </Label>
    </Stack>
  );
}
