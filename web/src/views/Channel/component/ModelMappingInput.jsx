import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, TextField, IconButton, List, ListItem, ListItemSecondaryAction } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { showError } from 'utils/common';

const ModelMappingInput = ({ value, onChange, disabled, error }) => {
  const { t } = useTranslation();
  const [mappings, setMappings] = useState([]);

  useEffect(() => {
    try {
      setMappings(value || [{ index: 0, key: '', value: '' }]);
    } catch (e) {
      setMappings([{ index: 0, key: '', value: '' }]);
    }
  }, [value]);

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
    } catch (error) {
      console.error('Invalid JSON input:', error);
      showError(t('channel_edit.invalidJson'));
    }
  };

  return (
    <Box>
      <List>
        {mappings.map(({ index, key, value }) => (
          <ListItem key={index}>
            <TextField
              label={t('channel_edit.modelMappingKey')}
              value={key}
              onChange={(e) => handleChange(index, 'key', e.target.value)}
              disabled={disabled}
              error={error}
              sx={{ mr: 1, flex: 1 }}
            />
            <TextField
              label={t('channel_edit.modelMappingValue')}
              value={value}
              onChange={(e) => handleChange(index, 'value', e.target.value)}
              disabled={disabled}
              error={error}
              sx={{ mr: 1, flex: 1 }}
            />
            <ListItemSecondaryAction>
              <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(index)} disabled={disabled}>
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      <Button startIcon={<AddIcon />} onClick={handleAdd} disabled={disabled}>
        {t('channel_edit.addModelMapping')}
      </Button>

      <Button startIcon={<AddIcon />} onClick={handleAddByJson} disabled={disabled}>
        {t('channel_edit.addModelMappingByJson')}
      </Button>

      <Dialog open={openJsonDialog} onClose={handleCloseJsonDialog} fullWidth maxWidth={'md'}>
        <DialogTitle>{t('channel_edit.addModelMappingByJson')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="json-input"
            label={t('channel_edit.jsonInputLabel')}
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

ModelMappingInput.propTypes = {
  value: PropTypes.arrayOf(
    PropTypes.shape({
      index: PropTypes.number,
      key: PropTypes.string,
      value: PropTypes.string
    })
  ),
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  error: PropTypes.bool
};

export default ModelMappingInput;
