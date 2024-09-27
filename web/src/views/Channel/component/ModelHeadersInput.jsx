import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  TextField,
  IconButton,
  List,
  ListItem,
  //   ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';

const ModelHeaderInput = ({ value, onChange, disabled, error }) => {
  const { t } = useTranslation();
  const [headers, setHeaders] = useState([]);

  useEffect(() => {
    try {
      setHeaders(value || [{ index: 0, key: '', value: '' }]);
    } catch (e) {
      setHeaders([{ index: 0, key: '', value: '' }]);
    }
  }, [value]);

  const handleAdd = () => {
    const newIndex = headers.length > 0 ? Math.max(...headers.map((m) => m.index)) + 1 : 0;
    setHeaders([...headers, { index: newIndex, key: '', value: '' }]);
  };

  const handleDelete = (index) => {
    const newHeaders = headers.filter((header) => header.index !== index);
    setHeaders(newHeaders);
    updateParent(newHeaders);
  };

  const handleChange = (index, field, newValue) => {
    const newHeaders = headers.map((header) => (header.index === index ? { ...header, [field]: newValue } : header));

    setHeaders(newHeaders);
    updateParent(newHeaders);
  };

  const updateParent = (newHeaders) => {
    onChange(newHeaders);
  };

  return (
    <Box>
      <List>
        {headers.map(({ index, key, value }) => (
          <ListItem key={index}>
            <TextField
              label={t('channel_edit.modelHeaderKey')}
              value={key}
              onChange={(e) => handleChange(index, 'key', e.target.value)}
              disabled={disabled}
              error={error}
              sx={{ mr: 1 }}
            />
            <TextField
              label={t('channel_edit.modelHeaderValue')}
              value={value}
              onChange={(e) => handleChange(index, 'value', e.target.value)}
              disabled={disabled}
              error={error}
              sx={{ mr: 1 }}
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
        {t('channel_edit.addModelHeader')}
      </Button>
    </Box>
  );
};

ModelHeaderInput.propTypes = {
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

export default ModelHeaderInput;
