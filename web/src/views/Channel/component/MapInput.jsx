import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { Box, List, Button, ListItem, TextField, IconButton, ListItemSecondaryAction } from '@mui/material';

import { Icon } from '@iconify/react';
import { showError } from 'utils/common';
import { useTranslation } from 'react-i18next';

const MapInput = ({ mapValue, onChange, disabled, error, label }) => {
  const { t } = useTranslation();
  const [mappings, setMappings] = useState([]);

  useEffect(() => {
    try {
      setMappings(mapValue || [{ index: 0, key: '', value: '' }]);
    } catch (e) {
      setMappings([{ index: 0, key: '', value: '' }]);
    }
  }, [mapValue]);

  const [openJsonDialog, setOpenJsonDialog] = useState(false);
  const [jsonInput, setJsonInput] = useState('');

  const handleAdd = () => {
    const newIndex = mappings.length > 0 ? Math.max(...mappings.map((m) => m.index)) + 1 : 0;
    setMappings([...mappings, { index: newIndex, key: '', value: '' }]);
  };

  const handleDelete = (index) => {
    const newMappings = mappings.filter((mapping) => mapping.index !== index);
    setMappings(newMappings);
    updateParent(newMappings);
  };

  const handleChange = (index, field, newValue) => {
    const newMappings = mappings.map((mapping) => (mapping.index === index ? { ...mapping, [field]: newValue } : mapping));

    setMappings(newMappings);
    updateParent(newMappings);
  };

  const updateParent = (newMappings) => {
    onChange(newMappings);
  };

  const handleAddByJson = () => {
    // 将当前映射转换为 key:value 形式的 JSON 字符串
    const currentMappingsObject = mappings.reduce((acc, { key, value }) => {
      if (key) acc[key] = value;
      return acc;
    }, {});
    const currentMappingsJson = JSON.stringify(currentMappingsObject, null, 2);
    setJsonInput(currentMappingsJson);
    setOpenJsonDialog(true);
  };

  const handleCloseJsonDialog = () => {
    setOpenJsonDialog(false);
    setJsonInput('');
  };

  const handleJsonInputChange = (event) => {
    setJsonInput(event.target.value);
  };

  const handleJsonSubmit = () => {
    try {
      const parsedJson = JSON.parse(jsonInput);
      const newMappings = Object.entries(parsedJson).map(([key, value], index) => ({
        index,
        key,
        value: value.toString()
      }));
      setMappings(newMappings);
      updateParent(newMappings);
      handleCloseJsonDialog();
    } catch (e) {
      showError(t('common.jsonFormatError'));
    }
  };

  return (
    <Box>
      <List>
        {mappings.map(({ index, key, value }) => (
          <ListItem key={index}>
            <TextField
              label={label.keyName}
              value={key}
              onChange={(e) => handleChange(index, 'key', e.target.value)}
              disabled={disabled}
              error={error}
              sx={{ mr: 1, flex: 1 }}
            />
            <TextField
              label={label.valueName}
              value={value}
              onChange={(e) => handleChange(index, 'value', e.target.value)}
              disabled={disabled}
              error={error}
              sx={{ mr: 1, flex: 1 }}
            />
            <ListItemSecondaryAction>
              <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(index)} disabled={disabled}>
                <Icon icon="mdi:delete" />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      <Button startIcon={<Icon icon="mdi:plus" />} onClick={handleAdd} disabled={disabled}>
        {t('channel_edit.mapAdd', { name: label.name })}
      </Button>

      <Button startIcon={<Icon icon="mdi:plus" />} onClick={handleAddByJson} disabled={disabled}>
        {t('channel_edit.mapAddByJson', { name: label.name })}
      </Button>

      <Dialog open={openJsonDialog} onClose={handleCloseJsonDialog} fullWidth maxWidth="md">
        <DialogTitle>{t('channel_edit.mapAddByJson', { name: label.name })}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="json-input"
            label={t('channel_edit.mapJsonInput')}
            type="text"
            fullWidth
            multiline
            rows={6}
            value={jsonInput}
            onChange={handleJsonInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseJsonDialog}>{t('common.cancel')}</Button>
          <Button onClick={handleJsonSubmit}>{t('common.submit')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

MapInput.propTypes = {
  mapValue: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  label: PropTypes.shape({
    name: PropTypes.string,
    keyName: PropTypes.string,
    valueName: PropTypes.string
  }).isRequired
};

export default MapInput;
