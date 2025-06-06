import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import {
  Card,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  InputBase,
  Paper,
  IconButton,
  Fade,
  useMediaQuery,
  Avatar,
  ButtonBase,
  Tooltip
} from '@mui/material';
import { Icon } from '@iconify/react';
import { API } from 'utils/api';
import { showError, ValueFormatter, copy } from 'utils/common';
import { useTheme } from '@mui/material/styles';
import Label from 'ui-component/Label';
import ToggleButtonGroup from 'ui-component/ToggleButton';
import { alpha } from '@mui/material/styles';

// ----------------------------------------------------------------------
export default function ModelPrice() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const ownedby = useSelector((state) => state.siteInfo?.ownedby);

  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableModels, setAvailableModels] = useState({});
  const [userGroupMap, setUserGroupMap] = useState({});
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedOwnedBy, setSelectedOwnedBy] = useState('all');
  const [unit, setUnit] = useState('K');
  const [onlyShowAvailable, setOnlyShowAvailable] = useState(false);

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
      .filter(([, model]) => selectedOwnedBy === 'all' || model.owned_by === selectedOwnedBy)
      .filter(([, model]) => !onlyShowAvailable || model.groups.includes(selectedGroup))
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
          provider: model.owned_by,
          userGroup: model.groups,
          type: model.price.type,
          input: formatPrice(price.input, model.price.type),
          output: formatPrice(price.output, model.price.type),
          extraRatios: model.price?.extra_ratios
        };
      });

    setRows(newRows);
    setFilteredRows(newRows);
  }, [availableModels, userGroupMap, selectedGroup, selectedOwnedBy, t, unit, onlyShowAvailable]);

  useEffect(() => {
    const filtered = rows.filter((row) => row.model.toLowerCase().includes(searchQuery.toLowerCase()));
    setFilteredRows(filtered);
  }, [searchQuery, rows]);

  const handleOwnedByChange = (newValue) => {
    setSelectedOwnedBy(newValue);
  };

  const handleGroupChange = (groupKey) => {
    setSelectedGroup(groupKey);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleUnitChange = (event, newUnit) => {
    if (newUnit !== null) {
      setUnit(newUnit);
    }
  };

  const toggleOnlyShowAvailable = () => {
    setOnlyShowAvailable((prev) => !prev);
  };

  const uniqueOwnedBy = ['all', ...new Set(Object.values(availableModels).map((model) => model.owned_by))];

  const getIconByName = (name) => {
    if (name === 'all') return null;
    const owner = ownedby.find((item) => item.name === name);
    return owner?.icon;
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <Stack spacing={3} sx={{ padding: theme.spacing(3) }}>
      <Box sx={{ position: 'relative' }}>
        <Fade in timeout={800}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              background:
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(45deg, #6b9fff 30%, #a29bfe 90%)'
                  : 'linear-gradient(45deg, #2196F3 30%, #3f51b5 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            {t('modelpricePage.availableModels')}
          </Typography>
        </Fade>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
          Available Models
        </Typography>
      </Box>

      <Card
        elevation={0}
        sx={{
          p: 3,
          overflow: 'visible',
          backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.6) : theme.palette.background.paper,
          borderRadius: 2
        }}
      >
        {/* 搜索和单位选择 */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
            mb: 3
          }}
        >
          <Paper
            component="form"
            sx={{
              p: '2px 4px',
              display: 'flex',
              alignItems: 'center',
              width: isMobile ? '100%' : 300,
              borderRadius: '8px',
              border: 'none',
              boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.05)',
              backgroundColor:
                theme.palette.mode === 'dark' ? alpha(theme.palette.background.default, 0.6) : theme.palette.background.default
            }}
          >
            <IconButton sx={{ p: '8px' }} aria-label="search">
              <Icon icon="eva:search-fill" width={18} height={18} />
            </IconButton>
            <InputBase sx={{ ml: 1, flex: 1 }} placeholder={t('modelpricePage.search')} value={searchQuery} onChange={handleSearchChange} />
            {searchQuery && (
              <IconButton sx={{ p: '8px' }} aria-label="clear" onClick={clearSearch}>
                <Icon icon="eva:close-fill" width={16} height={16} />
              </IconButton>
            )}
          </Paper>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Unit:
            </Typography>
            <ToggleButtonGroup
              value={unit}
              onChange={handleUnitChange}
              options={unitOptions}
              aria-label="unit toggle"
              size="small"
              sx={{
                '& .MuiToggleButtonGroup-grouped': {
                  borderRadius: '6px !important',
                  mx: 0.5,
                  border: 0,
                  boxShadow: theme.palette.mode === 'dark' ? '0 1px 4px rgba(0,0,0,0.2)' : '0 1px 4px rgba(0,0,0,0.05)',
                  '&.Mui-selected': {
                    boxShadow: `0 0 0 1px ${theme.palette.primary.main}`
                  }
                }
              }}
            />
          </Box>
        </Box>

        {/* 模型提供商标签 */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle1"
            sx={{
              mb: 1.5,
              fontWeight: 600,
              color: theme.palette.text.primary,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <Icon icon="eva:globe-outline" width={18} height={18} />
            {t('modelpricePage.channelType')}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1
            }}
          >
            {uniqueOwnedBy.map((ownedBy, index) => {
              const isSelected = selectedOwnedBy === ownedBy;
              return (
                <ButtonBase
                  key={index}
                  onClick={() => handleOwnedByChange(ownedBy)}
                  sx={{
                    borderRadius: '6px',
                    overflow: 'hidden',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    transform: isSelected ? 'translateY(-1px)' : 'none',
                    '&:hover': {
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      py: 0.75,
                      px: 1.5,
                      borderRadius: '6px',
                      backgroundColor: isSelected
                        ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.25 : 0.1)
                        : theme.palette.mode === 'dark'
                          ? alpha(theme.palette.background.default, 0.5)
                          : theme.palette.background.default,
                      border: `1px solid ${
                        isSelected ? theme.palette.primary.main : theme.palette.mode === 'dark' ? alpha('#fff', 0.08) : alpha('#000', 0.05)
                      }`,
                      boxShadow: isSelected ? `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}` : 'none'
                    }}
                  >
                    {ownedBy !== 'all' ? (
                      <Avatar
                        src={getIconByName(ownedBy)}
                        alt={ownedBy}
                        sx={{
                          width: 20,
                          height: 20,
                          backgroundColor: theme.palette.mode === 'dark' ? '#fff' : theme.palette.background.paper,
                          '.MuiAvatar-img': {
                            objectFit: 'contain',
                            padding: '2px'
                          }
                        }}
                      >
                        {ownedBy.charAt(0).toUpperCase()}
                      </Avatar>
                    ) : (
                      <Icon
                        icon="eva:grid-outline"
                        width={18}
                        height={18}
                        color={isSelected ? theme.palette.primary.main : theme.palette.text.secondary}
                      />
                    )}
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: isSelected ? 600 : 500,
                        color: isSelected ? theme.palette.primary.main : theme.palette.text.primary,
                        fontSize: '0.8125rem'
                      }}
                    >
                      {ownedBy === 'all' ? t('modelpricePage.all') : ownedBy}
                    </Typography>
                  </Box>
                </ButtonBase>
              );
            })}
          </Box>
        </Box>

        {/* 用户组标签 */}
        <Box sx={{ mb: 0 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1.5
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Icon icon="eva:people-outline" width={18} height={18} />
              {t('modelpricePage.group')}
            </Typography>

            <Tooltip title={onlyShowAvailable ? t('modelpricePage.showAll') : t('modelpricePage.onlyAvailable')} arrow>
              <ButtonBase
                onClick={toggleOnlyShowAvailable}
                sx={{
                  position: 'relative',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: theme.palette.mode === 'dark' ? '0 3px 10px rgba(0,0,0,0.4)' : '0 3px 10px rgba(0,0,0,0.1)'
                  },
                  '&:active': {
                    transform: 'translateY(0px)'
                  }
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    py: 0.6,
                    px: 1.5,
                    background: onlyShowAvailable
                      ? theme.palette.mode === 'dark'
                        ? `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.8)}, ${alpha(theme.palette.primary.dark, 0.9)})`
                        : `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                      : theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.paper, 0.6)
                        : alpha(theme.palette.background.paper, 1),
                    border: `1px solid ${
                      onlyShowAvailable
                        ? theme.palette.primary.main
                        : theme.palette.mode === 'dark'
                          ? alpha('#fff', 0.1)
                          : alpha('#000', 0.08)
                    }`,
                    borderRadius: '20px',
                    boxShadow: onlyShowAvailable
                      ? `0 2px 8px ${alpha(theme.palette.primary.main, 0.4)}`
                      : theme.palette.mode === 'dark'
                        ? '0 2px 6px rgba(0,0,0,0.2)'
                        : '0 2px 6px rgba(0,0,0,0.05)'
                  }}
                >
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: onlyShowAvailable
                        ? '#fff'
                        : theme.palette.mode === 'dark'
                          ? alpha(theme.palette.primary.main, 0.2)
                          : alpha(theme.palette.primary.main, 0.1),
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Icon
                      icon={onlyShowAvailable ? 'eva:checkmark-outline' : 'eva:funnel-outline'}
                      width={14}
                      height={14}
                      color={onlyShowAvailable ? theme.palette.primary.main : theme.palette.text.secondary}
                    />
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: onlyShowAvailable ? '#fff' : theme.palette.text.primary,
                      fontSize: '0.75rem',
                      letterSpacing: '0.01em',
                      textTransform: 'uppercase'
                    }}
                  >
                    {t('modelpricePage.onlyAvailable')}
                  </Typography>
                </Box>
              </ButtonBase>
            </Tooltip>
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1
            }}
          >
            {Object.entries(userGroupMap).map(([key, group]) => {
              const isSelected = selectedGroup === key;
              return (
                <Tooltip
                  key={key}
                  title={group.ratio > 0 ? `${t('modelpricePage.rate')}: x${group.ratio}` : t('modelpricePage.free')}
                  arrow
                >
                  <ButtonBase
                    onClick={() => handleGroupChange(key)}
                    sx={{
                      position: 'relative',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease',
                      transform: isSelected ? 'translateY(-1px)' : 'none',
                      '&:hover': {
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        py: 0.75,
                        px: 1.5,
                        borderRadius: '6px',
                        backgroundColor: isSelected
                          ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.25 : 0.1)
                          : theme.palette.mode === 'dark'
                            ? alpha(theme.palette.background.default, 0.5)
                            : theme.palette.background.default,
                        border: `1px solid ${
                          isSelected
                            ? theme.palette.primary.main
                            : theme.palette.mode === 'dark'
                              ? alpha('#fff', 0.08)
                              : alpha('#000', 0.05)
                        }`,
                        boxShadow: isSelected ? `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}` : 'none'
                      }}
                    >
                      <Icon
                        icon={isSelected ? 'eva:checkmark-circle-2-fill' : 'eva:radio-button-off-outline'}
                        width={16}
                        height={16}
                        color={isSelected ? theme.palette.primary.main : theme.palette.text.secondary}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isSelected ? 600 : 500,
                          color: isSelected ? theme.palette.primary.main : theme.palette.text.primary,
                          fontSize: '0.8125rem'
                        }}
                      >
                        {group.name}
                      </Typography>
                      {group.ratio > 0 ? (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: 24,
                            height: 16,
                            borderRadius: '4px',
                            backgroundColor:
                              group.ratio > 1
                                ? alpha(theme.palette.warning.main, theme.palette.mode === 'dark' ? 0.3 : 0.2)
                                : alpha(theme.palette.info.main, theme.palette.mode === 'dark' ? 0.3 : 0.2),
                            color: group.ratio > 1 ? theme.palette.warning.main : theme.palette.info.main,
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            px: 0.5
                          }}
                        >
                          x{group.ratio}
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: 24,
                            height: 16,
                            borderRadius: '4px',
                            backgroundColor: alpha(theme.palette.success.main, theme.palette.mode === 'dark' ? 0.3 : 0.2),
                            color: theme.palette.success.main,
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            px: 0.5
                          }}
                        >
                          {t('modelpricePage.free')}
                        </Box>
                      )}
                    </Box>
                  </ButtonBase>
                </Tooltip>
              );
            })}
          </Box>
        </Box>
      </Card>

      <Card
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: theme.palette.mode === 'dark' ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.05)'
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="25%" sx={{ fontWeight: 600, py: 1.5 }}>
                  {t('modelpricePage.model')}
                </TableCell>
                <TableCell width="15%" sx={{ fontWeight: 600, py: 1.5 }}>
                  {t('modelpricePage.channelType')}
                </TableCell>
                <TableCell width="10%" sx={{ fontWeight: 600, py: 1.5 }}>
                  {t('modelpricePage.type')}
                </TableCell>
                <TableCell width="17.5%" sx={{ fontWeight: 600, py: 1.5 }}>
                  {t('modelpricePage.inputMultiplier')}
                </TableCell>
                <TableCell width="17.5%" sx={{ fontWeight: 600, py: 1.5 }}>
                  {t('modelpricePage.outputMultiplier')}
                </TableCell>
                <TableCell width="15%" sx={{ fontWeight: 600, py: 1.5 }}>
                  {t('modelpricePage.other')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.length > 0 ? (
                filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell sx={{ py: 1.5 }}>
                      <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {row.model}
                        </Typography>
                        <IconButton size="small" onClick={() => copy(row.model)}>
                          <Icon icon="eva:copy-outline" width={16} height={16} />
                        </IconButton>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex',  alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                        <Avatar
                          src={getIconByName(row.provider)}
                          alt={row.provider}
                          sx={{
                            width: 20,
                            height: 20,
                            backgroundColor: theme.palette.mode === 'dark' ? '#fff' : theme.palette.background.paper,
                            '.MuiAvatar-img': {
                              objectFit: 'contain',
                              padding: '2px'
                            }
                          }}
                        >
                          {row.provider?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2">{row.provider}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      {row.type === 'tokens' ? (
                        <Label
                          color="primary"
                          sx={{
                            borderRadius: '4px',
                            fontWeight: 500,
                            fontSize: '0.75rem',
                            py: 0.25,
                            px: 0.75
                          }}
                        >
                          {t('modelpricePage.tokens')}
                        </Label>
                      ) : (
                        <Label
                          color="secondary"
                          sx={{
                            borderRadius: '4px',
                            fontWeight: 500,
                            fontSize: '0.75rem',
                            py: 0.25,
                            px: 0.75
                          }}
                        >
                          {t('modelpricePage.times')}
                        </Label>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Label
                        color="info"
                        variant="outlined"
                        sx={{
                          borderRadius: '4px',
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          py: 0.25,
                          px: 0.75
                        }}
                      >
                        {row.input}
                      </Label>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Label
                        color="info"
                        variant="outlined"
                        sx={{
                          borderRadius: '4px',
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          py: 0.25,
                          px: 0.75
                        }}
                      >
                        {row.output}
                      </Label>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>{getOther(t, row.extraRatios)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Stack spacing={1.5} alignItems="center">
                      <Icon icon="eva:search-outline" width={32} height={32} color={theme.palette.text.secondary} />
                      <Typography variant="body2" color="text.secondary">
                        {t('common.noData')}
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Stack>
  );
}

function getOther(t, extraRatios) {
  if (!extraRatios) return '';

  return (
    <Stack direction="column" spacing={0.5}>
      {Object.entries(extraRatios).map(([key, value]) => (
        <Label
          key={key}
          color="primary"
          variant="outlined"
          sx={{
            borderRadius: '4px',
            fontSize: '0.75rem',
            py: 0.25,
            px: 0.75
          }}
        >
          {t(`modelpricePage.${key}`)}: {value}
        </Label>
      ))}
    </Stack>
  );
}
