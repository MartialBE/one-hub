import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import {
  Card,
  Stack,
  Typography,
  Box,
  InputBase,
  Paper,
  IconButton,
  Fade,
  useMediaQuery,
  Avatar,
  ButtonBase,
  Tooltip,
  Grid
} from '@mui/material';
import { Icon } from '@iconify/react';
import { API } from 'utils/api';
import { showError, ValueFormatter } from 'utils/common';
import { useTheme } from '@mui/material/styles';
import ToggleButtonGroup from 'ui-component/ToggleButton';
import { alpha } from '@mui/material/styles';
import ModelCard from './component/ModelCard';
import ModelDetailModal from './component/ModelDetailModal';
import { MODALITY_OPTIONS } from 'constants/Modality';

// ----------------------------------------------------------------------
export default function ModelPrice() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const ownedby = useSelector((state) => state.siteInfo?.ownedby);

  const [availableModels, setAvailableModels] = useState({});
  const [modelInfoMap, setModelInfoMap] = useState({});
  const [userGroupMap, setUserGroupMap] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedOwnedBy, setSelectedOwnedBy] = useState('all');
  const [selectedModality, setSelectedModality] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [unit, setUnit] = useState('K');
  const [onlyShowAvailable, setOnlyShowAvailable] = useState(false);

  // 详情对话框状态
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedModelDetail, setSelectedModelDetail] = useState(null);

  const unitOptions = [
    { value: 'K', label: 'K' },
    { value: 'M', label: 'M' }
  ];

  // 获取可用模型
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

  // 获取模型信息
  const fetchModelInfo = useCallback(async () => {
    try {
      const res = await API.get('/api/model_info/');
      const { success, message, data } = res.data;
      if (success) {
        // 转换为 map 方便查找
        const infoMap = {};
        data.forEach((info) => {
          infoMap[info.model] = info;
        });
        setModelInfoMap(infoMap);
      } else {
        showError(message);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  // 获取用户组
  const fetchUserGroupMap = useCallback(async () => {
    try {
      const res = await API.get('/api/user_group_map');
      const { success, message, data } = res.data;
      if (success) {
        setUserGroupMap(data);
        setSelectedGroup(Object.keys(data)[0]);
      } else {
        showError(message);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchAvailableModels();
    fetchModelInfo();
    fetchUserGroupMap();
  }, [fetchAvailableModels, fetchModelInfo, fetchUserGroupMap]);

  // 提取所有唯一标签
  const allTags = [
    ...new Set(
      Object.values(modelInfoMap).flatMap((info) => {
        try {
          return JSON.parse(info.tags || '[]');
        } catch (e) {
          return [];
        }
      })
    )
  ];

  // 格式化价格
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

  // 过滤模型
  const filteredModels = Object.entries(availableModels)
    .filter(([modelName, model]) => {
      // 供应商筛选
      if (selectedOwnedBy !== 'all' && model.owned_by !== selectedOwnedBy) return false;

      // 仅显示可用
      if (onlyShowAvailable && !model.groups.includes(selectedGroup)) return false;

      // 搜索
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const modelInfo = modelInfoMap[modelName];
        const matchModel = modelName.toLowerCase().includes(query);
        const matchDescription = modelInfo?.description?.toLowerCase().includes(query);
        if (!matchModel && !matchDescription) return false;
      }

      // 模态筛选
      if (selectedModality !== 'all') {
        const modelInfo = modelInfoMap[modelName];
        if (modelInfo) {
          try {
            const inputModalities = JSON.parse(modelInfo.input_modalities || '[]');
            const outputModalities = JSON.parse(modelInfo.output_modalities || '[]');
            if (!inputModalities.includes(selectedModality) && !outputModalities.includes(selectedModality)) {
              return false;
            }
          } catch (e) {
            return false;
          }
        } else {
          return false;
        }
      }

      // 标签筛选
      if (selectedTag !== 'all') {
        const modelInfo = modelInfoMap[modelName];
        if (modelInfo) {
          try {
            const tags = JSON.parse(modelInfo.tags || '[]');
            if (!tags.includes(selectedTag)) return false;
          } catch (e) {
            return false;
          }
        } else {
          return false;
        }
      }

      return true;
    })
    .map(([modelName, model]) => {
      const group = userGroupMap[selectedGroup];
      const hasAccess = model.groups.includes(selectedGroup);
      const price = hasAccess
        ? {
          input: group.ratio * model.price.input,
          output: group.ratio * model.price.output
        }
        : { input: t('modelpricePage.noneGroup'), output: t('modelpricePage.noneGroup') };

      // 计算所有用户组的价格F
      const allGroupPrices = Object.entries(userGroupMap).map(([key, grp]) => {
        const hasGroupAccess = model.groups.includes(key);
        return {
          groupName: grp.name,
          groupKey: key,
          input: hasGroupAccess ? grp.ratio * model.price.input : 0,
          output: hasGroupAccess ? grp.ratio * model.price.output : 0,
          type: model.price.type,
          extraRatios:
            model.price.extra_ratios && hasGroupAccess
              ? Object.fromEntries(Object.entries(model.price.extra_ratios).map(([k, v]) => [k, (grp.ratio * v).toFixed(6)]))
              : null
        };
      });

      return {
        model: modelName,
        provider: model.owned_by,
        modelInfo: modelInfoMap[modelName],
        price,
        group: hasAccess ? group : null,
        type: model.price.type,
        priceData: {
          price: model.price,
          allGroupPrices
        }
      };
    })
    .sort((a, b) => {
      const ownerA = ownedby?.find((item) => item.name === a.provider);
      const ownerB = ownedby?.find((item) => item.name === b.provider);
      return (ownerA?.id || 0) - (ownerB?.id || 0);
    });

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

  const uniqueOwnedBy = [
    'all',
    ...[...new Set(Object.values(availableModels).map((model) => model.owned_by))].sort((a, b) => {
      const ownerA = ownedby?.find((item) => item.name === a);
      const ownerB = ownedby?.find((item) => item.name === b);
      return (ownerA?.id || 0) - (ownerB?.id || 0);
    })
  ];

  const getIconByName = (name) => {
    if (name === 'all') return null;
    const owner = ownedby.find((item) => item.name === name);
    return owner?.icon;
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleViewDetail = (modelData) => {
    setSelectedModelDetail(modelData);
    setDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailModalOpen(false);
    setSelectedModelDetail(null);
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
          {t('modelpricePage.modelPricing')}
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
              {t('modelpricePage.unit')}:
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
                      border: `1px solid ${isSelected ? theme.palette.primary.main : theme.palette.mode === 'dark' ? alpha('#fff', 0.08) : alpha('#000', 0.05)
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

        {/* 模态类型筛选 */}
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
            <Icon icon="eva:layers-outline" width={18} height={18} />
            {t('modelpricePage.modalityType')}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <ButtonBase
              onClick={() => setSelectedModality('all')}
              sx={{
                borderRadius: '6px',
                transition: 'all 0.2s ease',
                transform: selectedModality === 'all' ? 'translateY(-1px)' : 'none',
                '&:hover': { transform: 'translateY(-1px)' }
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
                  backgroundColor:
                    selectedModality === 'all'
                      ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.25 : 0.1)
                      : theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.default, 0.5)
                        : theme.palette.background.default,
                  border: `1px solid ${selectedModality === 'all'
                    ? theme.palette.primary.main
                    : theme.palette.mode === 'dark'
                      ? alpha('#fff', 0.08)
                      : alpha('#000', 0.05)
                    }`,
                  boxShadow: selectedModality === 'all' ? `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}` : 'none'
                }}
              >
                <Icon
                  icon="eva:grid-outline"
                  width={16}
                  height={16}
                  color={selectedModality === 'all' ? theme.palette.primary.main : theme.palette.text.secondary}
                />
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: selectedModality === 'all' ? 600 : 500,
                    color: selectedModality === 'all' ? theme.palette.primary.main : theme.palette.text.primary,
                    fontSize: '0.8125rem'
                  }}
                >
                  {t('modelpricePage.allModality')}
                </Typography>
              </Box>
            </ButtonBase>
            {Object.entries(MODALITY_OPTIONS).map(([key, option]) => {
              const isSelected = selectedModality === key;
              return (
                <ButtonBase
                  key={key}
                  onClick={() => setSelectedModality(key)}
                  sx={{
                    borderRadius: '6px',
                    transition: 'all 0.2s ease',
                    transform: isSelected ? 'translateY(-1px)' : 'none',
                    '&:hover': { transform: 'translateY(-1px)' }
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
                        ? alpha(theme.palette[option.color]?.main || theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.25 : 0.1)
                        : theme.palette.mode === 'dark'
                          ? alpha(theme.palette.background.default, 0.5)
                          : theme.palette.background.default,
                      border: `1px solid ${isSelected
                        ? theme.palette[option.color]?.main || theme.palette.primary.main
                        : theme.palette.mode === 'dark'
                          ? alpha('#fff', 0.08)
                          : alpha('#000', 0.05)
                        }`,
                      boxShadow: isSelected
                        ? `0 2px 8px ${alpha(theme.palette[option.color]?.main || theme.palette.primary.main, 0.2)}`
                        : 'none'
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: isSelected ? 600 : 500,
                        color: isSelected ? theme.palette[option.color]?.main || theme.palette.primary.main : theme.palette.text.primary,
                        fontSize: '0.8125rem'
                      }}
                    >
                      {option.text}
                    </Typography>
                  </Box>
                </ButtonBase>
              );
            })}
          </Box>
        </Box>

        {/* 标签筛选 */}
        {allTags.length > 0 && (
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
              <Icon icon="eva:pricetags-outline" width={18} height={18} />
              {t('modelpricePage.tags')}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <ButtonBase
                onClick={() => setSelectedTag('all')}
                sx={{
                  borderRadius: '6px',
                  transition: 'all 0.2s ease',
                  transform: selectedTag === 'all' ? 'translateY(-1px)' : 'none',
                  '&:hover': { transform: 'translateY(-1px)' }
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
                    backgroundColor:
                      selectedTag === 'all'
                        ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.25 : 0.1)
                        : theme.palette.mode === 'dark'
                          ? alpha(theme.palette.background.default, 0.5)
                          : theme.palette.background.default,
                    border: `1px solid ${selectedTag === 'all'
                      ? theme.palette.primary.main
                      : theme.palette.mode === 'dark'
                        ? alpha('#fff', 0.08)
                        : alpha('#000', 0.05)
                      }`,
                    boxShadow: selectedTag === 'all' ? `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}` : 'none'
                  }}
                >
                  <Icon
                    icon="eva:grid-outline"
                    width={16}
                    height={16}
                    color={selectedTag === 'all' ? theme.palette.primary.main : theme.palette.text.secondary}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: selectedTag === 'all' ? 600 : 500,
                      color: selectedTag === 'all' ? theme.palette.primary.main : theme.palette.text.primary,
                      fontSize: '0.8125rem'
                    }}
                  >
                    {t('modelpricePage.allTags')}
                  </Typography>
                </Box>
              </ButtonBase>
              {allTags.map((tag) => {
                const isSelected = selectedTag === tag;
                return (
                  <ButtonBase
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    sx={{
                      borderRadius: '6px',
                      transition: 'all 0.2s ease',
                      transform: isSelected ? 'translateY(-1px)' : 'none',
                      '&:hover': { transform: 'translateY(-1px)' }
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
                          ? alpha(theme.palette.info.main, theme.palette.mode === 'dark' ? 0.25 : 0.1)
                          : theme.palette.mode === 'dark'
                            ? alpha(theme.palette.background.default, 0.5)
                            : theme.palette.background.default,
                        border: `1px solid ${isSelected ? theme.palette.info.main : theme.palette.mode === 'dark' ? alpha('#fff', 0.08) : alpha('#000', 0.05)
                          }`,
                        boxShadow: isSelected ? `0 2px 8px ${alpha(theme.palette.info.main, 0.2)}` : 'none'
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isSelected ? 600 : 500,
                          color: isSelected ? theme.palette.info.main : theme.palette.text.primary,
                          fontSize: '0.8125rem'
                        }}
                      >
                        {tag}
                      </Typography>
                    </Box>
                  </ButtonBase>
                );
              })}
            </Box>
          </Box>
        )}

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
                    border: `1px solid ${onlyShowAvailable
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
                        border: `1px solid ${isSelected
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

      {/* 模型卡片网格 */}
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          共 {filteredModels.length} 个模型
        </Typography>
        {filteredModels.length > 0 ? (
          <Grid container spacing={3}>
            {filteredModels.map((model) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={model.model}>
                <ModelCard
                  model={model.model}
                  provider={model.provider}
                  modelInfo={model.modelInfo}
                  price={model.price}
                  group={model.group}
                  ownedbyIcon={getIconByName(model.provider)}
                  unit={unit}
                  type={model.type}
                  formatPrice={formatPrice}
                  onViewDetail={() => handleViewDetail(model)}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Card
            sx={{
              p: 8,
              textAlign: 'center',
              backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.6) : theme.palette.background.paper
            }}
          >
            <Stack spacing={2} alignItems="center">
              <Icon icon="eva:search-outline" width={64} height={64} color={theme.palette.text.secondary} />
              <Typography variant="h5" color="text.secondary">
                未找到匹配的模型
              </Typography>
              <Typography variant="body2" color="text.secondary">
                请尝试调整筛选条件或搜索关键词
              </Typography>
            </Stack>
          </Card>
        )}
      </Box>

      {/* 模型详情对话框 */}
      <ModelDetailModal
        open={detailModalOpen}
        onClose={handleCloseDetail}
        model={selectedModelDetail?.model}
        provider={selectedModelDetail?.provider}
        modelInfo={selectedModelDetail?.modelInfo}
        priceData={selectedModelDetail?.priceData}
        ownedbyIcon={selectedModelDetail ? getIconByName(selectedModelDetail.provider) : null}
        userGroupMap={userGroupMap}
        formatPrice={formatPrice}
        unit={unit}
      />
    </Stack>
  );
}
