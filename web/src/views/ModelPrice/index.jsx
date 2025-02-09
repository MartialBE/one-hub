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
  Chip,
  TextField,
  InputAdornment,
  styled,
  Box
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { API } from 'utils/api';
import { showError, ValueFormatter } from 'utils/common';
import { useTheme } from '@mui/material/styles';
import IconWrapper from 'ui-component/IconWrapper';
import Label from 'ui-component/Label';
import ToggleButtonGroup from 'ui-component/ToggleButton';
const GroupChip = styled(Chip)(({ theme, selected }) => ({
  margin: theme.spacing(0.5),
  cursor: 'pointer',
  height: '28px',
  borderRadius: '14px',
  padding: '0 12px',
  fontSize: '13px',
  fontWeight: 500,
  transition: 'all 0.2s ease-in-out',
  backgroundColor: selected ? theme.palette.primary.main : theme.palette.background.paper,
  color: selected ? theme.palette.common.white : theme.palette.text.secondary,
  border: `1px solid ${selected ? 'transparent' : theme.palette.divider}`,
  boxShadow: selected ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',

  '&:hover': {
    backgroundColor: selected ? theme.palette.primary.dark : theme.palette.action.hover,
    transform: 'translateY(-1px)',
    boxShadow: '0 3px 6px rgba(0,0,0,0.12)'
  },

  '& .MuiChip-label': {
    padding: '0 4px'
  }
}));

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
            if (type === 'tokens') {
              nowUnit = `/ 1${unit}`;
            }
            return ValueFormatter(value, true, unit === 'M') + nowUnit;
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
      <Typography variant="h4" color="textPrimary">
        {t('modelpricePage.availableModels')}
      </Typography>

      <Card sx={{ p: 2, backgroundColor: theme.palette.background.paper }}>
        <Stack spacing={2}>
          <Typography variant="subtitle2" color="textSecondary">
            {t('modelpricePage.group')}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              alignItems: 'center'
            }}
          >
            {Object.entries(userGroupMap).map(([key, group]) => (
              <GroupChip
                key={key}
                label={group.name}
                onClick={() => handleGroupChange({ target: { value: key } })}
                selected={selectedGroup === key}
                variant={selectedGroup === key ? 'filled' : 'outlined'}
              />
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
