import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Stack,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  TextField,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import axios from 'axios';

// System Logs Component
const SystemLogs = () => {
  const { t } = useTranslation();
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(5000); // Default: 5 seconds
  const [maxEntries, setMaxEntries] = useState(50);
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLogs, setFilteredLogs] = useState([]);
  const logsEndRef = useRef(null);
  const logsContainerRef = useRef(null);

  // Process a log entry from the backend
  const processLogEntry = (entry) => {
    try {
      // Map log levels to our frontend types
      let type = entry.Level.toLowerCase();

      // Map log levels to our frontend types
      switch (type) {
        case 'info':
          type = 'info';
          break;
        case 'error':
        case 'err':
        case 'fatal':
          type = 'error';
          break;
        case 'warn':
        case 'warning':
          type = 'warning';
          break;
        case 'debug':
          type = 'debug';
          break;
        default:
          type = 'info';
      }

      return {
        timestamp: new Date(entry.Timestamp).toISOString(),
        type,
        message: entry.Message
      };
    } catch (error) {
      console.error('Error processing log entry:', error, entry);
      return {
        timestamp: new Date().toISOString(),
        type: 'error',
        message: `Failed to process log entry: ${JSON.stringify(entry)}`
      };
    }
  };

  // Fetch logs from the API
  const fetchLogs = useCallback(async () => {
    try {
      const response = await axios.post('/api/system_info/log', {
        count: maxEntries
      });

      if (response.data.success) {
        const logData = response.data.data;
        const processedLogs = logData.map(processLogEntry);
        setLogs(processedLogs);
      } else {
        console.error('Failed to fetch logs:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  }, [maxEntries, processLogEntry]);

  // Fetch logs on component mount (only once)
  useEffect(() => {
    // Initial fetch only when component mounts
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // Empty dependency array means this runs once on mount

  // Fetch logs when maxEntries changes
  useEffect(() => {
    // Only fetch logs when maxEntries changes, not on initial render
    const controller = new AbortController();

    // Skip the initial render
    if (maxEntries !== 50) { // 50 is the default value
      fetchLogs();
    }

    return () => {
      controller.abort();
    };
  }, [maxEntries, fetchLogs]);

  // Set up auto-refresh interval
  useEffect(() => {
    // Only set up interval if autoRefresh is enabled
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchLogs, refreshInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, fetchLogs, refreshInterval]);

  // Filter logs based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredLogs(logs);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = logs.filter(
        (log) =>
          log.message.toLowerCase().includes(term) ||
          log.type.toLowerCase().includes(term) ||
          formatTimestamp(log.timestamp).toLowerCase().includes(term)
      );
      setFilteredLogs(filtered);
    }
  }, [logs, searchTerm]);

  // Scroll to bottom when logs update
  useEffect(() => {
    if (autoRefresh && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs, autoRefresh]);

  // Handle max entries change
  const handleMaxEntriesChange = (event) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value > 0 && value <= 500) {
      setMaxEntries(value);
    }
  };

  // Handle search term change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Clear logs display
  const handleClearLogs = () => {
    setLogs([]);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // Handle refresh interval change
  const handleRefreshIntervalChange = (event) => {
    const value = parseInt(event.target.value);
    setRefreshInterval(value);
  };

  // Get log type color
  const getLogTypeColor = (type) => {
    switch (type) {
      case 'info':
        return 'primary.main';
      case 'warning':
        return 'warning.main';
      case 'error':
        return 'error.main';
      case 'debug':
        return 'success.main';
      default:
        return 'text.primary';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <MainCard
      title={t('System Logs')}
      secondary={
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          sx={{ flexWrap: 'wrap' }}
        >
          <FormControlLabel
            control={<Switch checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} color="primary" />}
            label={t('Auto Refresh')}
            sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
          />
          <FormControl variant="outlined" size="small" sx={{ width: { xs: '100%', sm: '150px' }, minWidth: { xs: '100%', sm: '150px' } }}>
            <InputLabel id="refresh-interval-label">{t('Refresh Interval')}</InputLabel>
            <Select
              labelId="refresh-interval-label"
              value={refreshInterval}
              onChange={handleRefreshIntervalChange}
              label={t('Refresh Interval')}
              size="small"
              variant={'outlined'}
            >
              <MenuItem value={1000}>{t('1 second')}</MenuItem>
              <MenuItem value={3000}>{t('3 seconds')}</MenuItem>
              <MenuItem value={5000}>{t('5 seconds')}</MenuItem>
              <MenuItem value={10000}>{t('10 seconds')}</MenuItem>
              <MenuItem value={30000}>{t('30 seconds')}</MenuItem>
              <MenuItem value={60000}>{t('1 minute')}</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label={t('Max Entries')}
            type="number"
            size="small"
            value={maxEntries}
            onChange={handleMaxEntriesChange}
            InputProps={{ inputProps: { min: 1, max: 500 } }}
            sx={{ width: { xs: '100%', sm: '120px' } }}
          />
          <Button 
            variant="outlined" 
            color="error" 
            onClick={handleClearLogs} 
            startIcon={<Icon icon="solar:trash-bin-trash-bold" />}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            {t('Clear')}
          </Button>
        </Stack>
      }
    >
      {/* Prompt Message */}
      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', textAlign: 'center', mb: 2 }}>
        {t('view_more_logs_on_server')}
      </Typography>

      {/* Search Box */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder={t('Search logs...')}
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Icon icon="solar:magnifer-linear" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClearSearch}>
                  <Icon icon="solar:close-circle-bold" />
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{ mb: 1 }}
        />
      </Box>

      <Box
        ref={logsContainerRef}
        sx={{
          height: '450px',
          overflowY: 'auto',
          bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'background.paper' : 'grey.50'),
          p: 1,
          borderRadius: 1
        }}
      >
        {logs.length === 0 ? (
          <Typography variant="body2" color="textSecondary" sx={{ p: 2, textAlign: 'center' }}>
            {t('No logs available')}
          </Typography>
        ) : filteredLogs.length === 0 ? (
          <Typography variant="body2" color="textSecondary" sx={{ p: 2, textAlign: 'center' }}>
            {t('No matching logs found')}
          </Typography>
        ) : (
          filteredLogs.map((log, index) => (
            <Box key={index} sx={{ mb: 1, p: 1, borderRadius: 1, bgcolor: 'background.paper' }}>
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={1} 
                alignItems={{ xs: 'flex-start', sm: 'center' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
                  <Typography variant="caption" color="textSecondary">
                    {formatTimestamp(log.timestamp)}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: getLogTypeColor(log.type),
                      textTransform: 'uppercase',
                      fontWeight: 'bold'
                    }}
                  >
                    {log.type}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {log.message}
                </Typography>
              </Stack>
            </Box>
          ))
        )}
        <div ref={logsEndRef} />
      </Box>
    </MainCard>
  );
};

export default SystemLogs;
